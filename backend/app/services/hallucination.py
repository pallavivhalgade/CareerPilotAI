def verify_answer(answer,contexts):
 if not contexts:return {'grounded':False,'confidence':0,'unsupported_claims':['No retrieved evidence was available.']}
 a=set(answer.lower().split()); c=set(' '.join(contexts).lower().split()); overlap=len(a&c)/max(1,len(a));
 return {'grounded':overlap>=.18,'confidence':round(min(1,overlap*2),2),'unsupported_claims':[] if overlap>=.18 else ['The response has limited lexical evidence overlap; review citations before trusting it.']}
