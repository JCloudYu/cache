/**
* Created by world4jason on 2/3/16.
*/
const REMOTE_ADDR = "https://api.purimize.com/cache";

(function(){

	if( typeof( Storage ) === "undefined" )
	{
		alert( "Sorry, your browser doesn't support web storage !" );
		return;
	}



	// INFO: Display original stored notes
	showStoredNotes();



	// INFO: Add a new note
	var btnAdd 	= $( "#btnAdd" );

	btnAdd.on( "click", function(){

		// INFO: Generate unique id
		if( !localStorage.noteId )
			localStorage.noteId = 1;
		else
			localStorage.noteId++;



		var noteId = 'noteId' + localStorage.noteId;

		var defaultNoteInfo = {
			"title"			: "",
			"description"	: "",
			"token"			: "",
			"secret"		: "",
			"js"			: false,
			"css"			: false
		};
		var noteInfo = {};

		addNewNote( $(this), noteId, defaultNoteInfo );


		// INFO: Store note information to local storage
		if( !localStorage.noteInfo )
		{
			noteInfo[ noteId ] = defaultNoteInfo;
			setNoteInfo( noteInfo );
		}
		else
		{
			noteInfo = getNoteInfo();
			noteInfo[ noteId ] = defaultNoteInfo;
			setNoteInfo( noteInfo );
		}

	});



	// INFO: View JS, CSS Code
	$(document).on( 'click', '.viewJS', function(){
		var noteId 		= $(this).parent().parent().closest('div').attr('id');
		var noteInfo 	= getNoteInfo();
		window.open( REMOTE_ADDR + "/js/" + noteInfo[noteId].token );
	} );

	$(document).on( 'click', '.viewCSS', function(){
		var noteId 		= $(this).parent().parent().closest('div').attr('id');
		var noteInfo 	= getNoteInfo();
		window.open( REMOTE_ADDR + "/css/" + noteInfo[noteId].token );
	} );



	// INFO: Delete Note
	$(document).on( 'click', '.delete', function(){
		deleteDialogue( $(this) );
	} );



	// INFO: Update Descriptions
	$(document).on( 'click', '.update', function(){
		var note 			= $(this).parent().parent().closest( 'div' );
		var noteId 			= note.attr( 'id' );
		var textTitle 		= note.find( 'input[type=text]' );
		var textDescription = note.find( 'textarea' );
		var noteInfo 		= getNoteInfo();


		noteInfo[ noteId ].title = textTitle.val();
		noteInfo[ noteId ].description = textDescription.val();
		setNoteInfo( noteInfo );
		showNotification( "Successfully store your record !" );
	} );



	// INFO: Update Files
	var js 	= false;
	var css = false;
	var allowJS 	= /\.(js)$/;
	var allowCSS 	= /\.(css)$/;

	$(document).on( 'click', '.upload', function(){
		$(this).fileupload({
			dataType: 'json',
			singleFileUploads: false,
			add: function( e, data )
			{
				js = css = false;

				$.each( data.files, function( index, file ){

					if( allowJS.test( file.name ) ) {
						js = true;
					}
					else
					if( allowCSS.test( file.name ) ) {
						css = true;
					}
				} );

				var noteId = $(this).parent().parent().closest('div').attr( 'id' ),
					noteInfo = getNoteInfo()[ noteId ] || {},
					infoCollect	= [ REMOTE_ADDR ];

				if ( $.trim( noteInfo.token ).length > 0 )
					infoCollect.push( noteInfo.token );

				if ( $.trim( noteInfo.secret ).length > 0 )
					infoCollect.push( noteInfo.secret );



				data.url = infoCollect.join( '/' );
				data.submit();
			},
			done: function( e, data ) {
				var response = data.result;

				if( response.status != 0 )
				{
					console.log( response.msg );
					showNotification( response.msg );
					return;
				}


				// INFO: Store updated file information
				var noteInfo 	= getNoteInfo();
				var note 		= $(this).parent().parent().closest('div');
				var noteId 		= note.attr( 'id' );

				noteInfo[ noteId ].token 	= response.token;
				noteInfo[ noteId ].secret 	= response.secret;
				noteInfo[ noteId ].js 		= js;
				noteInfo[ noteId ].css 		= css;
				setNoteInfo( noteInfo );



				if( js ) note.find( '.viewJS').removeClass( 'hidden' );
				if( css ) note.find( '.viewCSS').removeClass( 'hidden' );


				showNotification( "Successfully upload your files !" );
			},
			fail: function( e, data ){
				console.log( data.errorThrown );
				showNotification( "Fail to upload ! Check the console log for more information !" );
			}
		});
	} );
})();



function showStoredNotes()
{
	if( !localStorage.noteInfo ) return;



	var noteInfo 	= getNoteInfo();
	var btnAdd 		= $( "#btnAdd" );

	for( var noteId in noteInfo )
	{
		addNewNote( btnAdd, noteId, noteInfo[noteId] );
	}
}


function showNotification( msg )
{
	var notification = $( '#notification' );

	notification.removeClass( 'hidden' )
		.html( '<i class="fa fa-close float-right"></i>' + msg)
		.fadeIn()
		.fadeOut( 3000 );


	notification.find( '.fa-close' ).on( 'click', { notification: notification }, function( event ){
		event.data.notification.addClass( 'hidden' );
	});

}

function addNewNote( selector, noteId, noteIdInfo )
{
	if( !noteIdInfo ) return;



	var title 		= noteIdInfo.title;
	var description = noteIdInfo.description;
	var viewJS		= noteIdInfo.js ? "": "hidden";
	var viewCSS		= noteIdInfo.css ? "": "hidden";

	$( selector ).before(
		'<div class="block-3 float-left" id="'+ noteId +'"> \
			<div class="block-header"> \
				<div class="icon float-right noselect viewJS ' + viewJS + '" title="view javascript content"><i class="fa fa-file-code-o"></i><sub>js</sub></div> \
				<div class="icon float-right noselect viewCSS ' + viewCSS + '" title="view css content"><i class="fa fa-file-text-o"></i><sub>css</sub></div> \
				<div class="icon float-right delete" title="delete this record"><i class="fa fa-trash-o"></i></div> \
				<input type="text" placeholder="Title" value="' + title + '"> \
			</div> \
			<div class="block-body parent-fill fill-all">\
				<textarea placeholder="Write some information about your uploaded css or javascript files ...">' + description + '</textarea> \
			</div> \
			<div class="block-footer parent-fill fill-horizontally"> \
				<div class="btn-basic update btn-color-danger noselect flex-1" title="store the content of this record">Store</div> \
				<div class="btn-basic upload btn-color-danger noselect flex-1" title="upload css or javascript files">Upload<input class="parent-fill fill-all" type="file" name="files[]" multiple /></div> \
			</div> \
		</div>'
	);
}

function getNoteInfo()
{
	if( localStorage.noteInfo )
		return $.parseJSON( localStorage.noteInfo );

	return {};
}

function setNoteInfo( noteInfo )
{
	localStorage.noteInfo = JSON.stringify( noteInfo );
}

function deleteDialogue( selector )
{
	var confirm 	= $('#dialogueDelete');
	var btnYes 		= confirm.children().find( '[data-confirm=yes]' );
	var btnNo 		= confirm.children().find( '[data-confirm=no]' );
	var btnClose 	= $( '.fa-close' );

	confirm.removeClass( 'hidden' );


	btnYes.on( 'click', { selector: selector, confirm: confirm }, function( event ){
		var note		= event.data.selector.parent().parent().closest('div');
		var noteId 		= note.attr('id');
		var noteInfo 	= getNoteInfo();

		note.remove();
		delete noteInfo[ noteId ];
		setNoteInfo( noteInfo );


		event.data.confirm.addClass( 'hidden' );

	} );

	btnNo.on( 'click', function(){
		confirm.addClass( 'hidden' );
	} );

	btnClose.on( 'click', function(){
		confirm.addClass( 'hidden' );
	} );

}
