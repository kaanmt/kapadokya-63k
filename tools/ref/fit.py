import re,math,sys,random
import numpy as np
from datetime import datetime
def load(f):
    s=open(f,encoding='utf-8').read()
    pts=re.findall(r'<trkpt lat="([-\d.]+)" lon="([-\d.]+)">(.*?)</trkpt>',s,re.S)
    P=[]
    for a,b,body in pts:
        e=re.search(r'<ele>([-\d.]+)</ele>',body); t=re.search(r'<time>([^<]+)</time>',body)
        if not e or not t: continue
        tt=t.group(1).replace('Z','').split('.')[0]
        P.append((float(a),float(b),float(e.group(1)),datetime.strptime(tt,'%Y-%m-%dT%H:%M:%S').timestamp()))
    return P
def hav(a,b):
    R=6371000.;p1=math.radians(a[0]);p2=math.radians(b[0]);dl=math.radians(b[1]-a[1]);dp=p2-p1
    x=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(x))
def prep(P):
    n=len(P);cum=[0.]
    for i in range(1,n):cum.append(cum[-1]+hav(P[i-1],P[i]))
    D=cum[-1]
    # moving time per point interval
    mt=[0.]*n  # moving seconds accumulated
    mv=[0.]
    for i in range(1,n):
        dt=P[i][3]-P[i-1][3];dd=cum[i]-cum[i-1]
        m=dt if (dt>0 and dd/dt>=0.3) else 0
        mv.append(mv[-1]+m)
    # 25 m resample, 3pt smooth
    rs=[];tm=[];j=0;d=0.
    while d<=D:
        while j<n-2 and cum[j+1]<d:j+=1
        d0,d1=cum[j],cum[j+1];u=min(1,max(0,(d-d0)/(d1-d0))) if d1>d0 else 0
        rs.append(P[j][2]+(P[j+1][2]-P[j][2])*u)
        tm.append(mv[j]+(mv[j+1]-mv[j])*u);d+=25
    rs=np.array(rs);sm=np.array([rs[max(0,k-1):min(len(rs)-1,k+1)+1].mean() for k in range(len(rs))])
    return dict(D=D,cum=cum,mv=mv,sm=sm,tm=np.array(tm),n=n,el=P[-1][3]-P[0][3])
def summary(R):
    sm=R['sm'];dz=np.diff(sm);up=dz[dz>0].sum();dn=-dz[dz<0].sum()
    half=len(dz)//2
    return up,dn
def segs(R,L=500):
    # segments of L metres (20 samples of 25 m)
    sm=R['sm'];tm=R['tm'];k=int(L/25);out=[]
    for a in range(0,len(sm)-k,k):
        b=a+k;dz=np.diff(sm[a:b+1]);out.append((L/1000,dz[dz>0].sum(),-dz[dz<0].sum(),tm[b]-tm[a],a*25/R['D']))
    return np.array(out)
def model(S,wu,wd,f,pace):
    E=S[:,0]+S[:,1]*wu/100+S[:,2]*wd/100
    return pace*E*(1+f*S[:,4])
def fit(S):
    best=None
    for wu in np.arange(0.3,1.61,0.02):
      for wd in np.arange(-0.6,0.41,0.02):
        E=S[:,0]+S[:,1]*wu/100+S[:,2]*wd/100
        if (E<=0.05).any():continue
        for f in np.arange(0,1.21,0.05):
          g=E*(1+f*S[:,4])
          pace=(S[:,3]/g).mean() if False else (S[:,3]*g/(g*g)).sum() if False else None
          # relative-error LS: minimise sum((T/(p*g)-1)^2) -> p = sum(T/g)... closed form
          r=S[:,3]/g;p=(r**2).sum()/r.sum()
          err=((r/p-1)**2).sum()
          if best is None or err<best[0]:best=(err,wu,wd,f,p)
    return best
def rms(S,p):
    wu,wd,f,pace=p
    m=model(S,wu,wd,f,pace);return math.sqrt((((S[:,3]/m)-1)**2).mean())
if __name__=='__main__':
    files=sys.argv[1:]
    allS=[]
    for f in files:
        P=load(f);R=prep(P);up,dn=summary(R)
        mov=R['mv'][-1];D=R['D']/1000
        S=segs(R,500);allS.append(S)
        print(f.split('/')[-1][:30],'pts',len(P),'km %.2f'%D,'elapsed %.1f min'%(R['el']/60),'moving %.1f min'%(mov/60),'up %.0f dn %.0f'%(up,dn),'flat pace %.2f min/km'%(mov/60/D))
        b=fit(S);print('  fit (500 m seg): wUp %.2f wDn %.2f f %.2f pace %.1f s/km-effort  rms rel err %.3f'%(b[1],b[2],b[3],b[4],math.sqrt(b[0]/len(S))),'nseg',len(S))
        # default weights (1,0) fit f only
        best=None
        for f_ in np.arange(0,1.21,0.02):
            E=S[:,0]+S[:,1]/100;g=E*(1+f_*S[:,4]);r=S[:,3]/g;p=(r**2).sum()/r.sum();e=((r/p-1)**2).sum()
            if best is None or e<best[0]:best=(e,f_,p)
        print('  default weights (1,0): best f %.2f rms %.3f'%(best[1],math.sqrt(best[0]/len(S))))
        # bootstrap
        random.seed(1);res=[]
        for _ in range(60):
            idx=[random.randrange(len(S)) for _ in range(len(S))]
            bb=fit(S[idx]);res.append(bb[1:4])
        res=np.array(res)
        print('  bootstrap 5-95%%: wUp %.2f-%.2f  wDn %.2f-%.2f  f %.2f-%.2f'%tuple(np.percentile(res[:,[0,0,1,1,2,2]],[5,95]*3,axis=0)[[0,1],[0,1,2,3,4,5]] if False else (np.percentile(res[:,0],5),np.percentile(res[:,0],95),np.percentile(res[:,1],5),np.percentile(res[:,1],95),np.percentile(res[:,2],5),np.percentile(res[:,2],95))))
