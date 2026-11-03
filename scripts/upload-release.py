"""Small resumable SSH chunks; validates exact bytes before any extraction."""
from pathlib import Path
import subprocess, hashlib, json, time, sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'.local/haiboss-source-20261103.tar.gz'
data=source.read_bytes();digest=hashlib.sha256(data).hexdigest()
config=Path.home()/'.ssh/agent-vps-sg-01/codex_ucloud_118_26_110_62.conf'
target='/home/codexops/apps/haiboss/shared/upload-'+digest[:12]
base=['ssh','-o','ConnectTimeout=20','-o','IPQoS=none','-F',str(config),'codex-ucloud']
chunks=[data[i:i+48000] for i in range(0,len(data),48000)]
for i,chunk in enumerate(chunks):
 code=f"import sys,pathlib,hashlib,os;p=pathlib.Path('{target}');p.mkdir(parents=True,exist_ok=True,mode=0o700);d=sys.stdin.buffer.read();assert len(d)=={len(chunk)};assert hashlib.sha256(d).hexdigest()=='{hashlib.sha256(chunk).hexdigest()}';f=p/'part-{i:04d}';f.write_bytes(d);os.chmod(f,0o600);print('verified')"
 for attempt in range(2):
  result=subprocess.run(base+['python3 -c "'+code+'"'],input=chunk,capture_output=True,timeout=75)
  if result.returncode==0 and b'verified' in result.stdout:break
 else:raise RuntimeError('SSH chunk failed; previous verified chunks retained')
 print(json.dumps({'chunk':i+1,'total':len(chunks),'verified':True}),flush=True)
code=f"import pathlib,hashlib,tarfile;p=pathlib.Path('{target}');d=b''.join((p/('part-%04d'%i)).read_bytes() for i in range({len(chunks)}));assert hashlib.sha256(d).hexdigest()=='{digest}';f=p/'source.tar.gz';f.write_bytes(d);t=tarfile.open(f);root=pathlib.Path('/home/codexops/apps/haiboss/releases/20261103-content-v1').resolve();assert all((root/m.name).resolve().is_relative_to(root) and not m.issym() and not m.islnk() for m in t.getmembers());t.extractall(root,filter='data');print('SOURCE_VERIFIED_AND_EXTRACTED')"
result=subprocess.run(base+['python3 -c "'+code+'"'],capture_output=True,timeout=75)
if result.returncode:raise RuntimeError(result.stderr.decode(errors='replace'))
print(result.stdout.decode().strip())
