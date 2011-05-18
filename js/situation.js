$(document).ready(function() {
  
  
  
  
  $('#current_decision').blur(function(el){
    // alert($('#current_decision').val())
    // alert(document.location)
    new_decision = $('#current_decision').val()
    if(new_decision == "") return;
    $.ajax({
            url: document.location + "/activity",
            global: false,
            type: "POST",
            data: ({el : 'current_decision', data: new_decision}),
            dataType: "html",
            async:true,
            success: function(msg){
               if(msg == 'ok') {
                 $('#decision').html('Decision: ' + new_decision);
               }
            }
         });
  });
  
  f = function(el){
    new_proposal = $('#proposal_add').val()
    if(new_proposal == "")
      return false;

    $.ajax({
            url: document.location + "/activity",
            global: false,
            type: "POST",
            data: ({el : 'proposals', data: new_proposal}),
            dataType: "html",
            async:true,
            success: function(msg){
               if(msg == 'ok') {
                 $.get('/t/proposal.mustache', function(data) {
                   $('.proposal.add').before(Mustache.to_html(data, {proposal: new_proposal}));
                   $('#proposal_add').val('');
                 });
               }
            }
         });
    return false;
  }
  
  $('#proposal_add').blur(f);

  activity_re = /(\d+) (\w+) (.*)/
  msg_re = /(\w+) (.*)/
  last_line = 0
  
  templates = {'attachment': "<p>{{attachment_url}}</p>",
    'msg': "<p><span>{{user}}</span> {{msg}}</p>"}
  
  function process_line(str) {
    if(str.length == 0) {
      return
    }
    re_exec = activity_re.exec(str)
    ts = re_exec[1]
    type = re_exec[2]
    payload = re_exec[3]
    rendered = ""
    switch(type) {
      case "attachment": 
        rendered = Mustache.to_html(templates[type], {'attachment_url': payload})
        break
      case "msg":
        var r = msg_re.exec(payload)
        rendered = Mustache.to_html(templates[type], {'user': r[1], 'msg': r[2]})
        break;
    }
    
    if(rendered.length > 0)
      $('#commhistory').append(rendered)
  }
  
  
  function refresh_activity(data) {
    var cur_line = 0
    var start_i = 0
    var current = 0
    for(current = 0 ;current < data.length; current++) {
      // TODO: What happens when a newline is missing at the end of the file.
      if(data.charAt(current) == '\n') {
        cur_line++
        if(cur_line > last_line) process_line(data.slice(start_i, current-1)) // Drop the \n from the splice.
        start_i = current
      }
    }
    
    last_line = cur_line

  }
  
  // Refresh ever 4s (default)
  $.periodic(function() {
    $.ajax({
        url: document.location + "/activity",
        success: function(data) { refresh_activity(data) },
        complete: this.ajax_complete
      });
  });
  
  // Run it right away.
  $.ajax({
      url: document.location + "/activity",
      success: function(data) { refresh_activity(data) }
    });
  
});