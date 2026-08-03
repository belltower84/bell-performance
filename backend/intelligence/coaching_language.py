from __future__ import annotations
from typing import Any
import re
VERSION='0.1.0'
class BellCoachingLanguage:
    def parse(self,text:str)->dict[str,Any]:
        mission=None; priorities=[]; targets={}; constraints={}; rules=[]; current=None
        for raw in text.splitlines():
            line=raw.strip()
            if not line or line.startswith('#'): continue
            up=line.upper()
            if up.startswith('MISSION '): mission=line.split(None,1)[1].strip(); current=None
            elif up.startswith('PRIORITY '): priorities=[x.strip() for x in line.split(None,1)[1].split('>')]; current=None
            elif up in ('TARGET','CONSTRAINT','RULE'): current=up.lower()
            elif current in ('target','constraint') and '=' in line:
                k,v=[x.strip() for x in line.split('=',1)]; (targets if current=='target' else constraints)[k]=self._value(v)
            elif current=='rule' and up.startswith('IF '): rules.append({'if':line[3:].strip(),'then':[]})
            elif current=='rule' and up.startswith('AND ') and rules: rules[-1]['if'] += ' AND '+line[4:].strip()
            elif current=='rule' and up.startswith('THEN ') and rules: rules[-1]['then'].append(line[5:].strip())
            elif current=='rule' and rules: rules[-1]['then'].append(line)
        return {'bcl_version':VERSION,'mission':mission,'priorities':priorities,'targets':targets,'constraints':constraints,'rules':rules}
    def _value(self,v):
        v=v.strip().strip('"\'')
        if re.fullmatch(r'-?\d+(\.\d+)?',v): return float(v) if '.' in v else int(v)
        return v
    def evaluate_rules(self,program:dict[str,Any],context:dict[str,Any])->list[dict[str,Any]]:
        fired=[]
        for r in program.get('rules',[]):
            expr=r['if']; ok=True
            for clause in re.split(r'\s+AND\s+',expr,flags=re.I):
                m=re.match(r'(\w+)\s*(<=|>=|<|>|=)\s*(.+)',clause.strip())
                if not m: ok=False; break
                k,op,v=m.groups(); actual=context.get(k); target=self._value(v)
                if actual is None: ok=False; break
                ok &= {'<':actual<target,'>':actual>target,'<=':actual<=target,'>=':actual>=target,'=':actual==target}[op]
            if ok: fired.append(r)
        return fired
