$(document).ready(function() {
  
  $('.kpiremove').click(function(el){
    var edit = $(this).prevAll('.kpiedit:first')
    var ref = edit.attr('ref')
    
    $.ajax({
      url: document.location + "/observations",
      type: "DELETE",
      data: ({ref: ref}),
      success: function(data) {
        edit.siblings().remove()
      }
    })
  })
  
  $('.kpiedit').click(function(el){
    
    var ref = $(this).attr('ref')
    if(!$(this).prev('.kpilabel').length) {
      $(this).before("<img src='' width='100%'><span class='kpilabel'></span>")
      $(this).after("<span class='kpiremove'>Remove</span>")
    }
    var label = $(this).prev('.kpilabel')
    var url = $(this).prevAll('img:first')
    var editbar = $(this).parent('.kpi').nextAll('.kpieditbar:first')
    var origlabel = label.text()
    
    var labelinput = editbar.children('input[name=kpieditlabel]')
    labelinput.unbind('keyup')
    labelinput.val(origlabel)
    labelinput.keyup(function(){
      label.text(labelinput.val())
    })
    
    var urlinput = editbar.children('input[name=kpiediturl]')
    urlinput.unbind('keyup')
    var origurl = url.attr('src')
    urlinput.val(origurl)
    urlinput.keyup(function(){
      url.attr('src', urlinput.val())
    })
    
    
    var done = editbar.children('.kpieditbardone')
    done.unbind('click')
    done.click(function(el){
      $.ajax({
        url: document.location + "/observations",
        type: "POST",
        data: ({ref: ref,
            label: labelinput.val(),
            url: urlinput.val()}),
        success: function(data) {
          editbar.slideUp('slow')
          urlinput.unbind('keyup')
          labelinput.unbind('keyup')      
        }
      })
    })
    
    var cancel = editbar.children('.kpieditbarcancel')
    cancel.unbind('click')
    cancel.click(function(el){
      label.text(origlabel)
      url.attr('src', origurl)
      editbar.slideUp('fast')
      urlinput.unbind('keyup')
      labelinput.unbind('keyup')
    })
    
    editbar.slideDown('slow')
  })

  
  
  
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