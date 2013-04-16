<html>
	<head>
		<title>Exemple of jquery-chat plugin</title>
		<!-- Styles -->
		<link rel="stylesheet" type="text/css" href="../dependencies/jquery/jquery-ui.css"/>
		<link rel="stylesheet" type="text/css" href="../dependencies/wijmo/jquery.wijmo.css"/>
		<link rel="stylesheet" type="text/css" href="../im.css"/>

		<!-- Scripts -->
		<script src="../dependencies/jquery/jquery.min.js" language="javascript" charset="utf-8"></script>
		<script src="../dependencies/jquery/jquery-ui.min.js" language="javascript" charset="utf-8"></script>
		<script type="text/javascript" src="../dependencies/contextmenu/jquery.contextMenu.js"></script>
		<script type="text/javascript" src="../dependencies/jquery-xmpp/jquery.xmpp.js"></script>
		<script type="text/javascript" src="../im.js"></script>
		<script type="text/javascript" src="../dependencies/wijmo/jquery.wijmo.min.js"></script>
		<script type="text/javascript" src="../dependencies/linkify/ba-linkify.min.js"></script>
		<script type="text/javascript">
			$(document).ready(function(){
				$("body div").im({
					url: "http://bosh.metajack.im:5280/xmpp-httpbind",
					/* facebook id */
					jid: "@chat.facebook.com",
					/* facebook password */
					password: "",
					debug:true,
					soundPath: "../"
				});
			});
		</script>
	</head>
	<body>
		<div>
		</div>
	</body>
</html>