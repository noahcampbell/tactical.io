from bottle import route, run, static_file, post, request, get, HTTPError, HTTPResponse, redirect
from os.path import join
import bottle
import pystache
import pymongo
from templates import Situation

bottle.debug(True)

connection = pymongo.Connection('172.16.53.159')

ACTIVITY_COUNTER='atx_ctr'

class situationdb:
  
  def __enter__(self):
    if connection.situationdb:
      sdb = connection.situationdb
      if sdb.situations:
        return sdb.situations
  
  def __exit__(self, type, value, tb):
    pass

class activity_entry:
    
    def __init__(self, id):
      self._id = id
      
    def __enter__(self):
      if connection.situationdb:
        sdb = connection.situationdb
        if sdb.situations:
          results = sdb.situations.find_and_modify({'situation_id': self._id}, {'$inc': {ACTIVITY_COUNTER: 1}}, fields=(ACTIVITY_COUNTER), new=True )
          return (sdb.situations, results[ACTIVITY_COUNTER])
    
    def __exit__ (self, type, value, tb):
      print 'done with activity'

@route('/')
def index():
  return static_file('welcome.html', root='templates')

@post('/situation/:id#.+#/proposal')
def add_proposal(id):
  
  data = request.forms.get("data")
  with activity_entry(id) as (situations, a_id):
    result = situations.update({'situation_id': id}, {'$push': {'current_proposals': {'proposal': data, 'atx': a_id}}}, safe=True)
    if result['ok'] == 1:
      return redirect('/situation/%s/activity/%d' % (id, a_id))
    
    raise HTTPError()

@route('/situation/:id#.+#/activity/:aid#\d+#')
def view_activity(id, aid):
  with situationdb() as situations:
    situation = situations.find({'situation_id': id},)
    if situation:
      pass
    else:
      raise HTTPError(404)

@route('/situation/:id#.+#/observations', method='POST')
def add_observation(id):
  ref = request.forms.get('ref')
  label = request.forms.get('label')
  url = request.forms.get('url')
  from_pos = request.forms.get('from')
  with activity_entry(id) as (situations, a_id):
    if from_pos: # move
      pass
    else:
      situation = situations.find_one({'situation_id': id})
      if 'observations' not in situation:
        situation['observations'] = dict()
      obs = situation['observations']
      if ref not in obs:
        obs[ref] = dict()
        
      ob = obs[ref]
      ob['label'] = label
      ob['url'] = url
      situations.save(situation)
      
@route('/situation/:id#.+#/observations', method='DELETE')
def remove_observation(id):
  ref = request.forms.get('ref')
  with activity_entry(id) as (situations, a_id):
    situation = situations.find_one({'situation_id': id})
    if 'observations' not in situation:
      raise HTTPError(404)
      
    obs = situation['observations']
    
    if ref not in obs:
      raise HTTPError(404)
    else:
      del obs[ref]
    
    situations.save(situation)

@route('/situation/:id#.+#/observations')
def view_observations(id):
  with situationdb() as situations:
    situation = situations.find_one({'situation_id': id},)
    
    if not situation or 'observations' not in situation:
      return {}
      
    return situation['observations']
     
@route('/situation/:id#.+#/activity')
def activity_stream(id):
  return static_file('%s/activity' % id, root="test/activity", mimetype="text/html")

@route('/situation/:id#.+#/activity', method='POST')
def situation_update(id):
  el = request.forms.get("el")
  data = request.forms.get("data")
  
  if connection.situationdb:
    sdb = connection.situationdb
    if sdb.situations:
      if el == 'current_decision':
        update_data = {"$set": {'current_decision': data}}
      
      if el == 'proposals':
        update_data = {'$push': {'current_proposals': {'proposal': data}}}
      
      if update_data:  
        result = sdb.situations.update({"situation_id": id}, update_data, safe=True)
        if result['ok'] == 1:
          return "ok"
      
  return "fail"


  
@get('/situation/:id#.+#')
def situation(id):
  
  if connection.situationdb:
    sdb = connection.situationdb
    if sdb.situations:
      situation = sdb.situations.find_one({'situation_id': id})
      if situation:
        return Situation(situation).render()
      else:
        return static_file('situation_unknown.html', root='templates')

#@get('/situation/:id#.+#/activity')
#def activity(id):
#  return "Empty"
  
@route('/:base#(css|js)#/:path#.+#')
def server_static(base,path):
  return static_file(join(base, path), root='.')
  
@route('/t/:path#.+.mustache#')
def templates(path):
  return static_file(path, root='templates')

@route('/favicon.ico')
def favicon():
  return static_file('favicon.ico', root='.')

run(host='localhost', port=4444, reloader=True)
