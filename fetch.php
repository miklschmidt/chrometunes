<?php 
//Hack hack hackidy hack
$content = file_get_contents($_GET['url']);
$content = substr($content, strpos($content, '<div id="watch-player"'));
$content = substr($content, strpos($content, 'flashvars="'));
$content = str_replace('flashvars="', '', $content);
$content = str_replace(substr($content, strpos($content, '"')), '', $content);
echo htmlspecialchars_decode($content);

?>