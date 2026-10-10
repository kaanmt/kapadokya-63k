import json,math,re,sys
import os as _os
_HERE=_os.path.dirname(_os.path.abspath(__file__))
s=open(_os.path.join(_HERE,'..','..','data.js'),encoding='utf-8').read()
C=json.loads(s[s.index('{'):s.rindex('}')+1])
N=C['n'];STEP=C['step'];TOTAL=C['total'];K=C['k'];ele=C['ele']
dist=[min(i*STEP,TOTAL) for i in range(N)];dist[N-1]=TOTAL
gain=[0.]*N;loss=[0.]*N
for i in range(1,N):
    d=ele[i]-ele[i-1]
    gain[i]=gain[i-1]+(d*K if d>0 else 0);loss[i]=loss[i-1]+(-d*K if d<0 else 0)
cps=[(c['km'],c['cut']) for c in C['cps']]
idxs=[max(0,min(N-1,round(km*1000/STEP))) for km,_ in cps]
def plan(target,fat,stops,wu,wd,level='orta'):
    ends=C['sec'][level];prev=0;eff=[];last=[]
    for b in ends:
        a=prev;km=(dist[b]-dist[a])/1000;up=gain[b]-gain[a];dn=loss[b]-loss[a]
        eff.append(max(0.05,km+up*wu/100+dn*wd/100));prev=b
    # CP index of sector: last sector with ci
    ci=[];
    for b in ends:
        c=0
        while c<len(idxs)-1 and idxs[c]<b:c+=1
        ci.append(c)
    E=sum(eff);cum=0;w=[]
    for e in eff:
        mid=(cum+e/2)/E;w.append(e*(1+fat/100*mid));cum+=e
    W=sum(w);M=target-sum(stops);el=0;arr=[]
    for i,b in enumerate(ends):
        el+=M*w[i]/W
        islast=(i==len(ends)-1) or ci[i+1]!=ci[i]
        if islast:
            arr.append(round(el,2))
            if ci[i]<len(stops):el+=stops[ci[i]]
    return arr
if __name__=='__main__':
    for nm,t,f,st in [('A',600,40,[2,4,3,4,2]),('B',660,50,[3,6,5,6,3]),('C',720,70,[5,10,8,10,5])]:
        print(nm,'default',plan(t,f,st,1,0),'| kalibre',plan(t,f,st,.88,-.24))
    # nutrition vectors
    E_STD=TOTAL/1000+gain[N-1]/100
    print('E_STD',E_STD)
    def jsround(x):return math.floor(x+0.5)
    def nut(kg,sweat,salty,temp,caf,M):
        sf={'low':.9,'normal':1,'high':1.2}[sweat]
        tf=.9 if temp<10 else 1 if temp<=20 else 1.2 if temp<=28 else 1.4
        kf=min(1.2,max(.85,math.sqrt(kg/75)))
        sp=E_STD/(M/60);i=min(1.2,max(.85,sp/7.8))
        cap=600 if kg<60 else 750
        fl=min(cap,jsround(500*sf*tf*kf*i/10)*10)
        conc={'low':600,'unknown':825,'high':1100}[salty]
        na=jsround(fl/1000*conc/10)*10
        carb=jsround(60*min(1.1,max(.9,i))/5)*5
        cc=jsround({'none':0,'low':1.5,'normal':3}[caf]*kg)
        return [fl,na,carb,cc]
    for args in [(85,'high','unknown',15,'low',585),(75,'normal','low',15,'low',637),(55,'low','high',30,'normal',700),(100,'high','unknown',25,'none',525),(85,'high','high',15,'low',585),(85,'high','low',15,'low',585)]:
        print(args,nut(*args))
