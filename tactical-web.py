from bottle import route, run, static_file
from os.path import join
import bottle
import pystache
import pymongo
from templates import Situation

bottle.debug(True)

@route('/')
def index():
  return static_file('welcome.html', root='templates')

@route('/situation/:id#.+#')
def situation(id):
  connection = pymongo.Connection('172.16.140.177')
  if connection.situationdb:
    sdb = connection.situationdb
    if sdb.situations:
      situation = sdb.situations.find_one({'situation_id': id})
      if situation:
        return Situation(situation).render()
      else:
        return static_file('situation_unknown.html', root='templates')

@route('/:base#(css|js)#/:path#.+#')
def server_static(base,path):
  return static_file(join(base, path), root='.')

run(host='localhost', port=4444, reloader=True)
