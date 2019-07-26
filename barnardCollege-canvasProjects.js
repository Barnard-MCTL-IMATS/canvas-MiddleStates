"use strict";

/**
* @file
* Written for Barnard College.
*
* @date 2019-05-14
* @modified 2019-07-25
* @author Benjamin Rosner, br2490
* @author Marko Krkeljas, mk4200
*/

let currentCourseID = null, // current course id.
/**
* The string representing the user's currently bcms_selectedRater user.
* Will return 0 if no user is selected.
*/
bcms_selectedRater = localStorage.getItem("barnardRater") || '0';

const barnardCollegeAccountID = ['439'], // Barnard's Canvas account.parent_account_id
bc_middleStatesCourses = ["82207"], // Courses considered for MS assessment
bcms_assessments = [{
	name: `Written Communication Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103736,
	rubric: 16050,
	moduleLocation: 112428,
	pos: 2,
},
{
	name: `Oral Communication Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103737,
	rubric: 16108,
	moduleLocation: 120965,
	pos: 3,
},
{
	name: `Critical Analysis and Reasoning Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103738,
	rubric: 16109,
	moduleLocation: 112431,
	pos: 4,
},
{
	name: `Information Literacy Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103739,
	rubric: 16110,
	moduleLocation: 112430,
	pos: 5,
},
{
	name: `Thinking Locally -- New York City Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103740,
	rubric: 16111,
	moduleLocation: 120966,
	pos: 6,
},
{
	name: `Thinking Through Global Inquiry Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103741,
	rubric: 16112,
	moduleLocation: 120967,
	pos: 7,
},
{
	name: `Thinking about Social Difference Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103742,
	rubric: 16113,
	moduleLocation: 112434,
	pos: 8,
},
{
	name: `Thinking with Historical Perspective Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103743,
	rubric: 16114,
	moduleLocation: 120968,
	pos: 9,
},
{
	name: `Thinking Quantitatively and Empirically Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103744,
	rubric: 16115,
	moduleLocation: 112432,
	pos: 10,
},
{
	name: `Thinking Technologically and Digitally Assessment (${ENV.current_user.id})`,
	assignmentGroupId: 103745,
	rubric: 16116,
	moduleLocation: 120969,
	pos: 11,
}];

// Get term and course data
function get_term_and_course_data() {
  // Temporary solution -- will update.
  $.ajaxSetup({ async: false });
  
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
  
function bcms_addSpeedGraderStudentSelects() {
  if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader")
  return;

  // Testing/Dev - Marko
  var result = get_term_and_course_data()
  var terms = result.terms;
  var courses = result.courses;
  // console.log(result, terms, courses);

  createTermSelect(terms);
  createCourseSelect();
  createStudentSelect();
  handleTermSelect(courses);
  handleCourseSelect();
  handleCommentBoxUpdate();
}

// Create term select object; populate with terms.
function createTermSelect(terms) {
  try {  
    let term_select = $( '<select />', {class: 'bc-ms', id: 'term-select'} );
    term_select.append(createSelectOption( '0', 'Select Term'));

    $.each(terms, function(key, value) {   
      term_select.append().append($("<option></option>").attr("value", key).text(value));
    });

    term_select.appendTo('form#add_a_comment');
  } catch (e) {
    console.error(e);
  }
}


// Create course select object.
function createCourseSelect() {
  try {
    let course_select = $( '<select />', {class: 'bc-ms', id: 'course-select'} );
    course_select.append(createSelectOption( '0', 'Select Course'));
    course_select.appendTo('form#add_a_comment');  
    
  } catch (e) {
    console.error(e);
  }
}


// Create student select object.
function createStudentSelect() {
  try {
    let student_select = $( '<select />', {class: 'bc-ms', id: 'student-select'} );
    student_select.append(createSelectOption( '0', 'Select Student'));
    student_select.appendTo('form#add_a_comment');  
    
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
    $("#term-select").change(function(){
      // Empty select on change.
      $('#course-select').empty().append(createSelectOption('0', 'Select Course'))
      $('#student-select').empty().append(createSelectOption('0', 'Select Student'))
      
      let term_selected_id = $(this).val();
      let filtered_courses = courses.filter(course => { return course.term == term_selected_id})

      $.each(filtered_courses, function(index, value) {
        $("#course-select").append().append($("<option></option>").attr("value", value.id).text(value.name));
      })
    });
  } catch (e) {
    console.error(e);
  }
}

function handleCourseSelect() {
  try {
    $("#course-select").change(function(){
      $('#student-select').empty().append(createSelectOption('0', 'Select Student')) // Empty select options
      
      let course_selected_id = $(this).val();      
      let students = get_student_list(course_selected_id)

      $.each(students, function(index, value) {
        $("#student-select").append().append($("<option></option>").attr("value", value.id).text(value.name));
      })
    });
  } catch (e) {
    console.error(e);
  }
}
  
function handleCommentBoxUpdate() {
  try {
    $('#course-select, #term-select, #student-select').change(function () {
      let term_selected_id = $("#term-select option:selected").val();
      let term_selected_text = $("#term-select option:selected").text();
      
      let course_selected_id = $("#course-select option:selected").val();
      let course_selected_text = $("#course-select option:selected").text();
      
      let student_selected_id = $("#student-select option:selected").val();
      let student_selected_text = $("#student-select option:selected").text();
      
      if (term_selected_id != 0) {
        let comment_box_text = [term_selected_text, course_selected_text, student_selected_text].join(" | ")
        $(document).ready(function() {
          $('#speed_grader_comment_textarea').val( comment_box_text )
        });
      } else { $('#speed_grader_comment_textarea').val(""); }
    });
  } catch (e) {
    console.error(e);
  }
}

// Middle State assessment object, create an assignment and do work.
let bcms_assignment = class { 
  
  constructor(name) {
    this.name = name
  }
  
/**
 * 
 * @param {int} assignmentGroup 
 * @param {int} assignmentPosition 
 * @param {int} rubricId 
 * @param {int} moduleLocation 
 */
  async middlestates(assignmentGroup, rubricId, moduleLocation) {
    if ( this.checkAssignment() ) return false;

    await this.createAssignment(assignmentGroup);
    await this.associateRubric(rubricId);
    await this.createModuleItem(moduleLocation);

    return true;
  }
  
  /**
   * 
   * @param {obj} requestSettings - url, type, and data payload.
   */
  async makeRequest(requestSettings) {
    try {
      const data = await $.ajax( requestSettings );
      return data;
    } catch (err) {
      console.log(err)
    }
  }

  async checkAssignment() {
    let result = [], 
    searchParams = {
      search_term: this.name,
    },
    settings = {
      url: `${window.location.origin}/api/v1/courses/${currentCourseID}/assignments`,
      type: "GET",
      data: searchParams
    };

    result = await this.makeRequest(settings);

    return result.length;
  }
  
  async createAssignment(assignmentGroup, data) {
    let result, 
    assignmentData = {
      assignment: {
        name: this.name,
        published: true,
        submission_types: { },
        assignment_group_id: assignmentGroup,
        ...data
      }
    },
    settings = {
      url: `${window.location.origin}/api/v1/courses/${currentCourseID}/assignments`,
      // method: "POST", // jQuery >= 1.9
      type: "POST",
      data: assignmentData
    };
    
    result = await this.makeRequest(settings);
    if (result.id)
    this.id = result.id;
    else
    throw new Error('');
  }
  
  async associateRubric(rubricID, data) {
    let result,
    rubricData = {
      rubric_association: {
        association_type: 'Assignment',
        association_id: this.id,
        rubric_id: rubricID,
        purpose: 'grading',
        ...data
      }
    },
    settings = {
      url: `${window.location.origin}/api/v1/courses/${currentCourseID}/rubric_associations`,
      // method: "POST", // jQuery >= 1.9
      type: "POST",
      data: rubricData,
    };
    
    result = await this.makeRequest(settings);
    // this.associatedRubric = result.rubric_settings.id;
  }
  
  async createModuleItem(moduleID, indent = 1, data) {
    let result,
    moduleData = {
      module_item: {
        title: this.name,
        content_id: this.id,
        type: 'Assignment',
        indent: indent,
        ...data
      }
    },
    settings = {
      url: `${window.location.origin}/api/v1/courses/${currentCourseID}/modules/${moduleID}/items`,
      // method: "POST", // jQuery >= 1.9
      type: "POST",
      data: moduleData
    };
    
    result = await this.makeRequest(settings);
    console.log(result);
    this.moduleItemId = result.id;
  }
  
};

async function bcms_userCourseConfiguration() {
  if ( !$('body.home').length ) return null; // Ditch if we are not on the homepage of the course.

  // Hide everything else but this users assignments.
  let limit = $('.ig-list'),
  user = ENV.current_user.id,
  assignments = $(`div.module-item-title > span > a:contains(\(${user}\))`); // the limiting parent of $.parentsUntil();

  $(`div.module-item-title > span > a:contains("Assessment"):not(:contains(${user}))`).parentsUntil( limit, 'li' ).hide();
  assignments.parentsUntil( limit, 'li' ).show();
  $('#context_module_item_blank').hide();

  // And create assignments if they do not exist.
  if ( assignments.length >= 10 ) return null;

  let assign = await bcms_createAssignments();
  
  // So I'd really like to wait for the results from createAssignments
  // before deciding whether or not to prompt the user. I cannot figure it out.
  // These functions -_-.... -BR
  console.log('result b', assign);
  setTimeout( () => { bcms_promptCourseHelp(); }, 500);
}

/**
 * This will handle creation of Middle States assignments.
 */
async function bcms_createAssignments() {
  let stateChange = false;

  bcms_assessments.forEach( assessment => {
    let assess = new bcms_assignment(assessment.name),
    existing = assess.checkAssignment();

    existing.then( assign => { 
      if ( assign ) {
        console.log(`Assessment exists: ${assessment.name}`);
      } else {
        console.log(`Creating assessment: ${assessment.name}`);

        assess.createAssignment(assessment.assignmentGroupId, assessment.pos)
        .then( () => { assess.createModuleItem(assessment.moduleLocation) } )
        .then( () => { assess.associateRubric(assessment.rubric) } )

        stateChange = true;
      }
    });
  });
  return stateChange;
}

/**
 * This is not needed but is in use for development.
 */
function bcms_getHelpButton() {
  try {    
    $( '<button />' , {
      id: 'bcms_createAssignments',
      class: 'Button Button--primary bcms_help_button',
      type: 'button',
      text: 'Help Page',
      style: 'margin-left:3px'
    }).on("click", e => {
      //not implemented
    }).appendTo('.header-bar');
  } catch (e) {
    console.error(e);
  }
}

/**
* Update the rubric preview CSS to align.
* @return {void} will exit function if not on an assignment page.
*/
function bc_fixRubricAlignment() {
  try {
    if (!ENV.ASSIGNMENT_ID) return;
    
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

/**
* Open the full rubric grading view in Canvas' Speed Grader.
* @param  {int} interval - timer interval ms
*/
let bc_openRubricView = (interval = 150) => {
  let rubric_view = $('#rubric_full'),
  button_full_rubric_view = $('button.toggle_full_rubric.edit.btn');
  setInterval(() => {
    if (rubric_view.css('display') === "none") {
      button_full_rubric_view.click();
      clearInterval(this);
    }
  }, interval);
}

/**
* Resize the Speed Grader view to display the entire rubric without being cramped.
* @return {void} will exit function if not on an assignment page.
*/
function bcms_resizeSpeedGraderView(leftWidth = '25%', rightWidth = '75%') {
  try {
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader") return;
    
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
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader") return;
    
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
    if (ENV.CONTEXT_ACTION_SOURCE !== "speed_grader") return;
    
    $( '<button />' , {
      id: 'bcms_save_and_next_student',
      class: 'Button Button--primary save_and_next',
      type: 'button',
      text: 'Save and Next Student',
      style: 'margin-left:3px'
    }).on("click", event => {
      $('button#comment_submit_button').click();
      setTimeout( () => {
        $('.icon-arrow-right.next').click();
      }, 250);
    }).insertAfter('button.save_rubric_button.Button.Button--primary');
    
  } catch (e) {
    console.error(e);
  }
}

/**
* Welcome Prompt
*/
function bcms_promptCourseHelp() {
  $('<div id="dialog-courseConfigured" title="Barnard Middle States GER Assessment Site">\
  <p>Welcome to the Barnard Middle States GER Assessment Site. This site is designed so that BC\
  faculty can quickly submit Middle States GER assessments through the Canvas\' speedgrader.</p>\
  <p>The course has been configured and the page must reload. Please select continue to finish.\
  You will only see this notice once.</p>\
  <p><span class="ui-icon ui-icon-extlink" style="float:left; margin:0 0 20px 0;"></span>\
  Instructions on how to use this site for assessment are available here.</p>\
  </div>')
  .dialog({
    resizable: false,
    height: "auto",
    width: 480,
    modal: true,
    buttons: {
      "Continue": function() {
        $( this ).dialog( "close" );
        window.location.reload();
      },
      Cancel: function() {
        $( this ).dialog( "close" );
      }
    }
  });
}

/**
* Prompt user to view the Speed Grader section of an assignment
*/
function bcms_promptDirectToSpeedGrader() {
  let link = $("#assignment-speedgrader-link > a");
  if ( !link.length ) return; //return if we're not on an assignment.
  
  // link.attr('target', '_self'); //target = self, not blank.
  let prompt = $('<div id="dialog-directToSpeedGrader" title="Open the Speed Grader?">\
  <p><span class="ui-icon ui-icon-extlink" style="float:left; margin:0 0 20px 0;"></span>Open the assessment screen (i.e., Speed Grader)?</p>\
  </div>');
  setTimeout( () => {
    prompt.dialog({
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
      buttons: {
        "Open Assessment": function() {
          $( this ).dialog( "close" );
          link.click();
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      }
    });
  }, 250)
}

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
* 
* @param {*} str_value 
* @param {*} str_text 
* @param {*} selected 
* @param  {...any} optional 
*/
function createSelectOption(str_value, str_text, selected = false, optional) {
  return $('<option />', {
    value: str_value,
    text: str_text,
    selected: selected,
    ...optional
  });
}

function aggBarnardMiddleStates() {
  bc_fixRubricAlignment();

  bcms_userCourseConfiguration(); //configure assignments.
  // bcms_getHelpButton();
  
  bcms_promptDirectToSpeedGrader();
  bcms_addSpeedGraderStudentSelects();

  bcms_resizeSpeedGraderView();
  bcms_updateSpeedGraderCommentBox();
  bcms_addSpeedGraderSaveNextButton();
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
