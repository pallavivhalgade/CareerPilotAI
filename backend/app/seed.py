from .services.rag import add_text,init
init()
knowledge=[('RAG','Retrieval augmented generation retrieves external context before generation. Strong systems combine semantic retrieval, keyword retrieval, reranking and evidence verification.'),('Agentic AI','Agentic systems use an orchestrated workflow where specialized steps can reason, call tools, inspect results and branch based on state.'),('Interview','A strong technical answer explains the concept, implementation, trade-offs and a concrete project example.'),('ATS','ATS matching should use truthful keyword and skills evidence. Never add a skill to a resume that the candidate does not actually possess.')]
for topic,text in knowledge:add_text(text,{'topic':topic,'source':'built-in career knowledge'})
print('Seed complete')
