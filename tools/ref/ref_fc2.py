import sys,math,json,numpy as np
sys.path.insert(0,'.')
from fit import load,hav
import ref
WU,WD=0.88,-0.24
def smooth_time(P,sec):
    n=len(P);half=sec/2;t=np.array([p[3] for p in P]);lat=np.array([p[0] for p in P]);lon=np.array([p[1] for p in P])
    out=[]
    lo=0;hi=0
    cl=np.concatenate([[0],np.cumsum(lat)]);co=np.concatenate([[0],np.cumsum(lon)])
    for i in range(n):
        while hi<n and t[hi]<=t[i]+half:hi+=1
        while lo<hi and t[lo]<t[i]-half:lo+=1
        c=hi-lo
        out.append(((cl[hi]-cl[lo])/c,(co[hi]-co[lo])/c,P[i][2],P[i][3]))
    return out
def analyze(P0,sec=9):
    P=smooth_time(P0,sec);n=len(P);cum=[0.]
    for i in range(1,n):cum.append(cum[-1]+hav(P[i-1],P[i]))
    D=cum[-1];mv=[0.]
    for i in range(1,n):
        dt=P[i][3]-P[i-1][3];dd=cum[i]-cum[i-1]
        mv.append(mv[-1]+(dt if dt>0 and dd/dt>=0.3 else 0))
    rs=[];tm=[];j=0;d=0.
    while d<=D:
        while j<n-2 and cum[j+1]<d:j+=1
        d0,d1=cum[j],cum[j+1];u=min(1,max(0,(d-d0)/(d1-d0))) if d1>d0 else 0
        rs.append(P[j][2]+(P[j+1][2]-P[j][2])*u);tm.append(mv[j]+(mv[j+1]-mv[j])*u);d+=25
    rs=np.array(rs);sm=np.array([rs[max(0,k-1):min(len(rs)-1,k+1)+1].mean() for k in range(len(rs))])
    tm=np.array(tm);dz=np.diff(sm);dt=np.diff(tm)
    eff=np.maximum(0.002,0.025+np.maximum(dz,0)*WU/100+np.maximum(-dz,0)*WD/100)
    n_=len(eff);h=n_//2
    r=(dt[h:].sum()/eff[h:].sum())/(dt[:h].sum()/eff[:h].sum())
    x=(np.arange(1,n_+1))/n_
    # race effort per step
    effr=[0]*ref.N
    for i in range(1,ref.N):
        effr[i]=max(0.002,(ref.dist[i]-ref.dist[i-1])/1000+(ref.gain[i]-ref.gain[i-1])*WU/100+(ref.loss[i]-ref.loss[i-1])*WD/100)
    runKm=n_*0.025
    res={}
    for name,pw in [('good',1.),('mid',1.5),('bad',2.)]:
        lo,hi=0.,20.
        for _ in range(70):
            mid=(lo+hi)/2;m=1+mid*x**pw
            ratio=((eff[h:]*m[h:]).sum()/eff[h:].sum())/((eff[:h]*m[:h]).sum()/eff[:h].sum())
            if ratio<r:lo=mid
            else:hi=mid
        k=lo;base=dt.sum()/(eff*(1+k*x**pw)).sum()
        c=0;out=[];ci=0
        for i in range(1,ref.N):
            c+=base*effr[i]*(1+k*(ref.dist[i]/1000/runKm)**pw)/60
            while ci<len(ref.idxs) and ref.idxs[ci]==i:out.append(c);ci+=1
        res[name]=out
    return dict(km=D/1000,mov=mv[-1],slow=(r-1)*100,base=base,**res)
