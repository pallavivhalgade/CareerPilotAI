import re
INJECTION_PATTERNS=[r'ignore (all|any|previous|prior) instructions',r'system prompt',r'reveal .*prompt',r'jailbreak',r'developer message']
def check_input(text:str,max_chars:int=50000):
 if len(text)>max_chars: return False,'Input is too large.'
 low=text.lower()
 if any(re.search(p,low) for p in INJECTION_PATTERNS): return False,'Potential prompt injection detected.'
 return True,'ok'
def clean_output(text:str,max_chars=12000): return text[:max_chars].strip()
