import pystache
import email
import hashlib

class Proposal(pystache.View):
  template_path = 'templates'

# The Situation Class
class Situation(pystache.View):

  template_name = 'situation'
  template_extension = 'html'
  template_path = 'templates'
  
  def __init__(self, situation):
    super(Situation, self ).__init__()
    self.source = situation
  
  # Format the opened datetime
  def opened(self):
    if self.source['opened']:
      return self.source['opened'].strftime('%D %H:%M:%S %Z')
    else:
      return None
      
  def owner_firstname(self):
    if self.source['owner']:
      (name, email_address) = email.utils.parseaddr(self.source['owner'])
      if name:
        return name.split(' ')[0]
        
  def account(self):
    if self.source['owner']:
      (name, email_address) = email.utils.parseaddr(self.source['owner'])
      if email_address:
        return email_address
  
  def current_monitors(self):
    return []
    
  def history(self):
    return []
  
  def participants(self):
    if self.source['participants']:
      return [{'name': z[0], 'email': z[1], 'hash': hashlib.md5(z[1]).hexdigest()} for z in [email.utils.parseaddr(x) for x in self.source['participants']]]
  
  # Denormalize the notification.email
  def email(self):
    if self.source['notification']:
      if self.source['notification']['email']:
        return self.source['notification']['email']
      
  # Denormalize the notification.irc
  def irc(self):
    if self.source['notification']:
      if self.source['notification']['irc']:
        return self.source['notification']['irc']
  
  # Get every thing else
  def __getattr__(self, k):
    if k in self.source:
      return self.source[k]
    else:
      print ("'%s' Not Found" % (k))