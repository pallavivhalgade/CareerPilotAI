import json,time
from ..models import Event
def event(db,user_id,typ,latency,detail=None):
 db.add(Event(user_id=user_id,event_type=typ,latency_ms=latency,detail_json=json.dumps(detail or {}))); db.commit()
