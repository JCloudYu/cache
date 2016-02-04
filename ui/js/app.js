(function(){
	"use strict";

	if ( !window.localStorage )
	{
		alert( "Your browser doesn't support localStorage scheme!\nPlease use chrome instead!" );
		return;
	}


	// region [ Overwrite default localStorage's behavior ]
	(function(){
		var __extStorage = function( field, val ) {

			var routeRoot = JSON.parse( localStorage.getItem( 'data-trunk' ) || "{}" );
			if ( arguments.length < 1 ) return routeRoot;



			var
			readMode	= ( arguments.length < 2 ),
			routes		= field.toString().split( '.' ),
			lastKey		= routes.pop(),
			endPoint	= routeRoot;

			routes.forEach(function( fieldName ){
				if ( !endPoint ) return;

				if ( endPoint.hasOwnProperty( fieldName ) )
					endPoint = endPoint[ fieldName ];
				else
					endPoint = ( readMode ) ? undefined : (endPoint[ fieldName ] = {});
			});

			if ( !readMode )
			{
				if ( val === undefined )
					delete endPoint[ lastKey ];
				else
					endPoint[ lastKey ] = val;


				localStorage.setItem( 'data-trunk', JSON.stringify( routeRoot ) );
				return;
			}


			return ( !endPoint ) ? endPoint : endPoint[lastKey];
		};

		oops.core.expand( __extStorage, {
			getItem: function(){
				return localStorage.getItem.apply( localStorage, arguments );
			},
			setItem: function(){
				return localStorage.setItem.apply( localStorage, arguments );
			}
		}, true );

		window.extStorage = __extStorage;
	})();
	// endregion



	var
	// INFO: Global constants
	REMOTE_ADDR 	= "https://api.purimize.com/cache",
	ITEM_TPL		= $( '[data-tpl="tile"]' ).html(),
	MAIN_CONTAINER	= $( 'main' ),
	INSERT_ANCHOR	= $( MAIN_CONTAINER.children()[0] ),
	DELETE_CONFIRM	= $( '#dialogueDelete' ),
	GLOBAL_UPLOADER	= $( '#fileUpload' );



	// region [ Hook main item events ]
	MAIN_CONTAINER.on( 'click', '[data-behavior="item-proc"]', function( e ){
		var
		target		= $(e.target).closest( '[data-behavior="item-proc"]' ),
		repoId		= target.attr( 'data-rel' ),
		repoInfo	= extStorage( 'repo.' + repoId ) || {};

		switch ( target.attr( 'data-id' ) )
		{
			case "btnViewJS":
				if ( repoInfo.js ) window.open( REMOTE_ADDR + "/js/" + repoInfo.token );
				break;

			case "btnViewCSS":
				if ( repoInfo.css ) window.open( REMOTE_ADDR + "/css/" + repoInfo.token );
				break;

			case "btnDelete":
				deleteDialogue( repoId );
				break;

			case "btnContextUpdate":
				var
				repoItem	= $( target.parents( '[data-role="repo-item"]' )[0] ),
				title 		= repoItem.find( 'input[type=text]' ),
				desc		= repoItem.find( 'textarea' );



				oops.core.expand( repoInfo, {
					title: title.val(),
					description: desc.val()
				}, true);


				extStorage( 'repo.' + repoId, repoInfo );
				showNotification( "Successfully store your record !" );
				break;

			case "btnFileUpload":
				doUpload( repoInfo );
				break;

			default:
				break;
		}
	});

	$( '#btnAdd' ).on( "click", function() {
		var
		repoId = 'r' + moment().unix(),
		defaultNoteInfo = {
			rId: repoId,
			title: '',
			description: '',
			token: '',
			secret: '',
			js: false,
			css: false
		};

		addNewNote( repoId, defaultNoteInfo );
		extStorage( 'repo.' + repoId, defaultNoteInfo );
	});

	(function(){
		DELETE_CONFIRM.find( '[data-confirm="yes"]' ).on( 'click', function(){
			var repoId	 = DELETE_CONFIRM.attr( 'data-repo-id' );

			extStorage( 'repo.' + repoId, undefined );
			$( '[data-role="repo-item"][data-rel="' + repoId + '"]' ).remove();
			DELETE_CONFIRM.addClass( 'hidden' );
		});

		DELETE_CONFIRM.find( '[data-confirm="no"]' ).on( 'click', function(){
			DELETE_CONFIRM.addClass( 'hidden' );
		});

		DELETE_CONFIRM.find( '.fa-close' ).on( 'click', function(){
			DELETE_CONFIRM.addClass( 'hidden' );
		});
	})();
	// endregion










	// INFO: Display original stored notes
	showStoredNotes();

	function showStoredNotes() {
		var repoTrunk = extStorage( 'repo' );
		for( var repoId in repoTrunk )
		{
			if ( !repoTrunk.hasOwnProperty( repoId ) ) continue;
			addNewNote( repoId, repoTrunk[repoId] );
		}
	}
	function showNotification( msg ) {
		var notification = $( '#notification' );

		$(notification.children()[0]).html( msg );

		notification.removeClass( 'hidden' )
		.fadeIn()
		.fadeOut( 3000 );
	}
	function addNewNote( noteId, noteIdInfo ) {
		$.tmpl( ITEM_TPL, {
			noteId: noteId,
			title: noteIdInfo.title,
			description: noteIdInfo.description,
			hasJS: !!noteIdInfo.js,
			hasCSS: !!noteIdInfo.css
		}).insertAfter( INSERT_ANCHOR ).fadeIn( 1000 );
	}
	function deleteDialogue( repoId ) {
		DELETE_CONFIRM.attr( 'data-repo-id', repoId ).removeClass( 'hidden' );
	}
	function doUpload( repoInfo ) {
		var
		js			= false,
		css			= false,
		allowJS 	= /\.(js)$/,
		allowCSS	= /\.(css)$/;

		GLOBAL_UPLOADER.fileupload({
			dataType: 'json',
			singleFileUploads: false,
			add: function( e, data ) {
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

				var infoCollect	= [ REMOTE_ADDR ];

				if ( $.trim( repoInfo.token ).length > 0 )
					infoCollect.push( repoInfo.token );

				if ( $.trim( repoInfo.secret ).length > 0 )
					infoCollect.push( repoInfo.secret );



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
				repoInfo.token 	= response.token;
				repoInfo.secret = response.secret;
				repoInfo.js 	= js;
				repoInfo.css 	= css;
				extStorage( 'repo.' + repoInfo['rId'], repoInfo );



				var op,
				item	= MAIN_CONTAINER.find( '[data-role="repo-item"][data-rel="' + repoInfo['rId'] + '"]' ),
				addOp	= item.addClass,
				rmOp	= item.removeClass;


				// INFO: Toggle class "has-js"
				op = ( js ) ? addOp : rmOp;
				op.call( item, 'has-js' );


				// INFO: Toggle class "has-css"
				op = ( css ) ? addOp : rmOp;
				op.call( item, 'has-css' );



				showNotification( "Successfully upload your files !" );
			},
			fail: function( e, data ){
				console.log( data.errorThrown );
				showNotification( "Fail to upload ! Check the console log for more information !" );
			}
		}).trigger( 'click' );
	}
})();

