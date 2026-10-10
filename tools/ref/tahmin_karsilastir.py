import sys,json,os,numpy as np
_HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,_HERE)
from fit import load
import ref, ref_fc2
# ref_fc2 içindeki analyze'ı kullanıp parkur boyu birikimli süreyi bağımsız hesapla
WU,WD=0.88,-0.24
def cum_all(P0):
    # ref_fc2.analyze ile aynı model; noktaların yerine her adım
    import numpy as np
    from fit import hav
    P=ref_fc2.smooth_time(P0,9);n=len(P);cum=[0.]
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
    x=(np.arange(1,n_+1))/n_;runKm=n_*0.025
    effr=np.zeros(ref.N)
    for i in range(1,ref.N):effr[i]=max(0.002,(ref.dist[i]-ref.dist[i-1])/1000+(ref.gain[i]-ref.gain[i-1])*WU/100+(ref.loss[i]-ref.loss[i-1])*WD/100)
    res={}
    for name,pw in [('good',1.),('mid',1.5),('bad',2.)]:
        lo,hi=0.,20.
        for _ in range(70):
            mid=(lo+hi)/2;m=1+mid*x**pw
            ratio=((eff[h:]*m[h:]).sum()/eff[h:].sum())/((eff[:h]*m[:h]).sum()/eff[:h].sum())
            if ratio<r:lo=mid
            else:hi=mid
        k=lo;base=dt.sum()/(eff*(1+k*x**pw)).sum()
        c=np.zeros(ref.N)
        for i in range(1,ref.N):c[i]=c[i-1]+base*effr[i]*(1+k*(ref.dist[i]/1000/runKm)**pw)/60
        res[name]=c
    return res,np.cumsum(effr)
js=json.load(open(os.path.join(_HERE,'..','out','tahmin-js.json')));stops=[3,6,5,6,3]
for nm,f in [('27Eyl',os.path.join(_HERE,'..','veri','kosu-27eylul.gpx')),('4Ekim',os.path.join(_HERE,'..','veri','kosu-4ekim.gpx'))]:
    C,EC=cum_all(load(f));band=js[nm]['fc']['band']
    for lv,d in js[nm]['lv'].items():
        mt=0;ma=0;me=0;mc=0;sb=0;ci=0
        for (a,b),t,arr,e in zip(d['secs'],d['t'],d['arr'],d['eff']):
            pt=C['mid'][b]-C['mid'][a];mt=max(mt,abs(pt-t));ma=max(ma,abs(C['mid'][b]+sb-arr));pe=max(0.05,(ref.dist[b]-ref.dist[a])/1000+(ref.gain[b]-ref.gain[a])*1.0/100+(ref.loss[b]-ref.loss[a])*0/100);me=max(me,abs(pe-e))
            if b in ref.idxs:
                cp=d['cp'][ci];good=C['good'][b]*(1-band)+sb;bad=C['bad'][b]*(1+band)+sb;cut=[120,300,420,570,660,750][ci]
                mc=max(mc,abs(good-cp[1]),abs(bad-cp[2]),abs(cut-(C['mid'][b]+sb)-cp[3]));sb+=stops[ci] if ci<5 else 0;ci+=1
        print('%s %-4s sektör %2d | süre fark %.1e, varış fark %.1e, efor fark %.1e, nokta (iyi/kötü/kesim payı) fark %.1e | hareket JS %.2f PY %.2f, bitiş %.2f'%(nm,lv,len(d['t']),mt,ma,me,mc,d['M'],C['mid'][-1],d['finish']))
