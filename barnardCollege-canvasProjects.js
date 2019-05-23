"use strict";

/**
* @file
* Written for Barnard College.
*
* @date 2019-05-14
* @author Benjamin Rosner, br2490
*/


/********************************/
/*********** GET DATA ***********/
/********************************/


// Get term and course data
function get_term_and_course_data() {
  // Temporary solution -- will update.
  $.ajaxSetup({ async: false });

  const barnardCollegeAccountID = ['439']; // Barnard sub-account
  let terms = {}; // object to hold terms
  let courses = []; // Array to hold courses
  $.getJSON(
    // Canvas course API,
    `${window.location.origin}/api/v1/users/${ENV.current_user.id}/courses?include[]=term&include[]=account&per_page=150`, 
    // results as data.
    data => {
      $.each(data, (key, value) => {
        if ( !barnardCollegeAccountID.includes(value.account.parent_account_id) ) return; // Continue with Barnard Courses.
        if ( !terms[value.term.id] ) { 
          terms[value.term.id] = value.term.name; // while this will only hold unique values,
        }
        courses.push({ 'id': value.id, 'name': value.name, 'term': value.term.id });
      });  
    }).fail( (xhr, status, error) => {
      console.error(`Failed to get API response. ${error}`);
    });

    $.ajaxSetup({ async: true });
    return {terms, courses}
}


// Get student data for a given course
function get_student_list(course_id) {
  $.ajaxSetup({ async: false });
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;

    let students = []

     $.getJSON(
      `${window.location.origin}/api/v1/courses/${course_id}/enrollments`,
        data => {
          $.each(data, (key, value) => {
            students.push({ 'id': value.user.id, 'name': value.user.name });
          });
        }).fail( (xhr, status, error) => {
          console.error(`Failed to get API response. ${error}`);
        });
        $.ajaxSetup({ async: true });
        return students
  } catch (e) {
  console.error(e);
  }
}


/**********************************************/
/*********** CREATE SELECT ELEMENTS ***********/
/**********************************************/


// Create term select object; populate with terms.
function createTermSelect(terms) {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;
    
    let term_select = $( '<select />', {class: 'bc-ms', id: 'term-select'} );
    term_select.append(createSelectOption( '0', 'Select Term'));

    $.each(terms, function(key, value) {   
      term_select.append().append($("<option></option>")
                     .attr("value", key)
                     .text(value));
    });
    term_select.appendTo('.content_box');
  } catch (e) {
  console.error(e);
  }
}


// Create course select object.
function createCourseSelect() {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;

    let course_select = $( '<select />', {class: 'bc-ms', id: 'course-select'} );
        course_select.append(createSelectOption( '0', 'Select Course'));
        course_select.appendTo('.content_box');  

  } catch (e) {
  console.error(e);
  }
}


// Create student select object.
function createStudentSelect() {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;

    let student_select = $( '<select />', {class: 'bc-ms', id: 'student-select'} );
        student_select.append(createSelectOption( '0', 'Select Student'));
        student_select.appendTo('.content_box');  

  } catch (e) {
  console.error(e);
  }
}


/*********************************************/
/*********** HANDLE SELECT CHANGES ***********/
/*********************************************/

// Handle term changes
// Updates course-select options based on term selection
// ToDos: update value attribute w/ course IDs
function handleTermSelect(courses) {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;

    $("#term-select").change(function(){
      // Empty select on change.
      $('#course-select').empty().append(createSelectOption('0', 'Select Course'))
      $('#student-select').empty().append(createSelectOption('0', 'Select Student'))
      
      let term_selected_id = $(this).val();
      let filtered_courses = courses.filter(course => { return course.term == term_selected_id})

      $.each(filtered_courses, function(index, value) {
        $("#course-select").append().append($("<option></option>")
                    .attr("value", value.id)
                    .text(value.name));
      })
    });
  } catch (e) {
  console.error(e);
  }
}


function handleCourseSelect() {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;

    $("#course-select").change(function(){
      $('#student-select').empty().append(createSelectOption('0', 'Select Student')) // Empty select options
      
      let course_selected_id = $(this).val();      
      let students = get_student_list(course_selected_id)

      $.each(students, function(index, value) {
        $("#student-select").append().append($("<option></option>")
                    .attr("value", value.id)
                    .text(value.name));
      })
    });
  } catch (e) {
  console.error(e);
  }
}

function handleCommentBoxUpdate() {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;
    $('#course-select, #term-select, #student-select').change(function () {
        let term_selected_id = $("#term-select option:selected").val();
        let term_selected_text = $("#term-select option:selected").text();
        
        let course_selected_id = $("#course-select option:selected").val();
        let course_selected_text = $("#course-select option:selected").text();
        
        let student_selected_id = $("#student-select option:selected").val();
        let student_selected_text = $("#student-select option:selected").text();

        if (term_selected_id != 0) {
          let comment_box_text = [term_selected_text,course_selected_text, student_selected_text].join(" | ")
          $(document).ready(function() {
            $('#speed_grader_comment_textarea').val( comment_box_text )
          });
        } else { $('#speed_grader_comment_textarea').val(""); }
    });
  } catch (e) {
  console.error(e);
  }
}


/*********** Dev code end -- Marko K. ************/
/*********** Dev code end -- Marko K. ************/
/*********** Dev code end -- Marko K. ************/



let currentCourseID = null; // current course id.
const barnardCollegeAccountID = ['439'], // Barnard's Canvas account.parent_account_id
bc_middleStatesCourses = ["82207"]; // Courses considered for MS assessment

/**
* Fetch current course ID number.
* @return {string} current course ID from location.
*/
function bc_getCourseID() {
  try {
    if (location.pathname.match(/\/courses\//))
    return location.pathname.match(/\/courses\/(\d*)/)[1];
    else
    return null;
  } catch(e){
    console.error(`Could not get course ID. ${e}`);
  }
}

/**
* Update the rubric preview CSS to align.
* @return {void} will exit function if not on an assignment page.
*/
function bc_fixRubricAlignment() {
  try {
    if (!ENV.ASSIGNMENT_ID) {
      return;
    }
    let tableRows = $("table.ratings");
    tableRows.each((pos, data) => { 
      let row = $(data); 
      let row_columns = row.find('td').length;
      let column_size = 100 / row_columns;
      row.find('td').css('width', column_size+'%');
    });
  } catch(e){
    console.error(`Could not find/resize rubric. ${e}`);
  }
}

// Middle States project sites modifications.
// date: 2019-05-14
// author: br2490

/**
* The string representing the user's currently bcms_selectedRater user.
* Will return 0 if no user is selected.
*/
let bcms_selectedRater = localStorage.getItem("barnardRater") || '0';

/**
* Add a dropdown containing a list of "raters" for users to select. Selection hides
* all other assignments on the page.
* @return {[type]} [description]
*/
function bcms_addRaterSelectToPage() {
  try {
    // Are we on the course's Module page?
    if ( !$( '#context_modules' ).length )
    return; // we are not, so this function can not continue.
    
    // Create dropdown.
    let max = 8, // max number of users @todo make global
    limit = $('.ig-list'), // the limiting parent of $.parentsUntil();
    select = $( '<select />', {class: 'bc-ms', id: 'rater-dropdown'} );
    
    // Our initial option.
    select.append(createSelectOption( '0', 'Select Your Professor ID', (bcms_selectedRater === '0') ));
    
    for (let o = 1; o <= max; o++) { // o for option.
      let currentRater = `Rater ${o}`;
      select.append(createSelectOption( currentRater, currentRater, (currentRater === bcms_selectedRater) ));
    }
    
    console.log(select);
    
    // Handle change.
    select.change(() => {
      $( '#rater-dropdown option:selected' ).each(function() { // nb: this is not a multiple-enabled select.
        bcms_selectedRater = $( this ).val();
        localStorage.setItem( 'barnardRater' , bcms_selectedRater);
        if (bcms_selectedRater === '0') {
          $('div.module-item-title > span > a').parentsUntil( limit, 'li' ).show();
        } else {
          $('div.module-item-title > span > a:contains(Rater):not(:contains(' + bcms_selectedRater + '))').parentsUntil( limit, 'li' ).hide();
          $('div.module-item-title > span > a:contains(' + bcms_selectedRater + ')').parentsUntil( limit, 'li' ).show();
        }
        $('#context_module_item_blank').hide();
      });
    })
    .change();
    
    select.appendTo('.header-bar'); // Append,
    select.change();                // and trigger.
    
  } catch ( e ) {
    console.error(`Error @bcms_addRaterSelectToPage(): ${e}`);
  }
}

/**
* Open the full rubric grading view in Canvas' Speed Grader.
* @param  {int} interval - timer interval ms
*/
let bc_openRubricView = ( (interval = 50) => {
  let rubric_view = $('#rubric_full');
  let button_full_rubric_view = $('button.toggle_full_rubric.edit.btn');
  setInterval(() => { 
    if (rubric_view.css('display') === "none")
    button_full_rubric_view.click();
  }, interval);
});

/**
* Resize the Speed Grader view to display the entire rubric without being cramped.
* @return {void} will exit function if not on an assignment page.
*/
function bcms_resizeSpeedGraderView(leftWidth = '25%', rightWidth = '75%') {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;
    
    let width_resizer = $('#full_width_container');
    width_resizer.find('#left_side').css('width', leftWidth);
    width_resizer.find('#right_side').css('width', rightWidth);
  } catch (e) {
    console.error(e);
  }
}

/**
* Modify the Comment box to "Student Name"
* @TODO: Integrate Term/Course/User drop-down for selection of students.
*
* @return {void} will exit function if not on an assignment page.
*/
function bcms_updateSpeedGraderCommentBox() {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;
    
    // Quickly open the rubric to marking (rating) mode.
    bc_openRubricView(150);
    
    // Display
    let div_assignment_comment = $('.content_box:contains("Assignment Comments")');
    div_assignment_comment.prependTo(div_assignment_comment.prev());
    let h2_assignment_comment = div_assignment_comment.find('h2:contains("Assignment Comments")');
    h2_assignment_comment.text('Student Name');
    let input_assignment_comment_placeholder = div_assignment_comment.find('textarea#speed_grader_comment_textarea');
    input_assignment_comment_placeholder.attr('placeholder', 'Student Name');
    
  } catch (e) {
    console.error(e);
  }
}

/**
 * Add button to save and view the next student in Speed Grader.
 */
function bcms_addSpeedGraderSaveNextButton() {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
    return;
    
    $( '<button />' , {
      id: 'bcms-save-and-next-student',
      class: 'Button next',
      type: 'button',
      text: 'Save and Next Student'
    }).on("click", event => {
      $('.comment_submit_button').click();
      $('.icon-arrow-right.next').click();
    }).insertAfter('button.save_rubric_button.Button.Button--primary');
    
  } catch (e) {
    console.error(e);
  }
}


/**
* Prompt user to view the Speed Grader section of an assignment
*/
function bcms_promptDirectToSpeedGrader() {
  if ( !$('#assignment-speedgrader-link').length ) return;
  $('<div id="dialog-speedgrader" title="Open the Speed Grader?">\
  <p><span class="ui-icon ui-icon-extlink" style="float:left; margin:0 0 20px 0;"></span>Open the assessment screen (i.e., Speed Grader)?</p>\
  </div>').insertAfter('#main');
  
  $( "#dialog-speedgrader" ).dialog({
    resizable: false,
    height: "auto",
    width: 400,
    modal: true,
    buttons: {
      "Open Assessment": function() {
        $( this ).dialog( "close" );
        $('#assignment-speedgrader-link > a')[0].click();
      },
      Cancel: function() {
        $( this ).dialog( "close" );
      }
    }
  });
}


/**
* IN DEVELOPMENT.
*/
function bcms_getCourseList() { 
  const barnardCollegeAccountID = ['439']; // Barnard sub-account
  let terms = {}; // object to hold terms
  let courses = {}; // object to hold courses
  
  let termSelect = $( '<select />', {class: 'bc-ms', id: 'term-dropdown', 'selectedIndex': 0} );  
  termSelect.append(createSelectOption(0, 'Select a Term', true));
  
  let courseSelect = $( '<select />', {class: 'bc-ms', id: 'course-dropdown', 'selectedIndex': 0} );  
  courseSelect.append(createSelectOption(0, 'Select a Course', true));
  
  $.getJSON(
    // Canvas course API,
    `${window.location.origin}/api/v1/users/${ENV.current_user.id}/courses?include[]=term&include[]=account&per_page=150`, 
    // results as data.
    data => {
      $.each(data, (key, value) => {
        if ( !barnardCollegeAccountID.includes(value.account.parent_account_id) ) return; // Continue with Barnard Courses.
        
        // There can be duplicate terms since we're starting at the COURSE level.
        if ( !terms[value.term.id] ) { 
          terms[value.term.id] = value.term.name; // while this will only hold unique values,
          termSelect.append(createSelectOption(value.term.id, value.term.name, false)); // this will dupe, so only pass wyn.
        }
        
        // Create the course options:
        courses[value.id] = {'name': value.name, 'term': value.term.id};
        courseSelect.append(createSelectOption(value.id, value.name, false));
      });
      
      // debug
      console.log(terms, courses, courseSelect, termSelect);
      $('body').append(termSelect);
      $('body').append(courseSelect);
      
    }).fail( (xhr, status, error) => {
      console.error(`Failed to get API response. ${error}`);
    });
  }


  /**
  * 
  * @param {*} str_value 
  * @param {*} str_text 
  * @param {*} selected 
  * @param  {...any} optional 
  */
  function createSelectOption(str_value, str_text, selected = false, ...optional) {
    return $('<option />', {
      value: str_value,
      text: str_text,
      selected: selected,
      ...optional
    });
  }
  
  // Aggregate them all. This should be a class/obj (not this function, the whole ^)
  function aggBarnardMiddleStates() {
    bc_fixRubricAlignment();
    
    // @todo: create object, run these
    bcms_addRaterSelectToPage();
    bcms_addSpeedGraderSaveNextButton();
    bcms_resizeSpeedGraderView();
    bcms_updateSpeedGraderCommentBox();
    bcms_promptDirectToSpeedGrader();

    // Testing/Dev - Marko
    var result = get_term_and_course_data()
    var terms = result.terms;
    var courses = result.courses;

    createTermSelect(terms);
    createCourseSelect();
    createStudentSelect();
    handleTermSelect(courses);
    handleCourseSelect();
    handleCommentBoxUpdate();

  }

  /**
  * Document ready.
  */
  try {
    $( document ).ready(function() {
      currentCourseID = bc_getCourseID();
      if ( bc_middleStatesCourses.includes(currentCourseID) ) {
        aggBarnardMiddleStates();
      }
    });
  } catch( e ) {
    console.error(`document.ready(): ${e}`);
  }
