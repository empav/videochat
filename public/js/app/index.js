function senMail(event) {
    event.preventDefault();
    var url = document.getElementById('url').value;
    var formData = new FormData(document.getElementById('mailForm'));
    var xmlhttp;
    if(window.XMLHttpRequest){
        xmlhttp = new XMLHttpRequest();
    }else{
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if(xmlhttp.readyState < 4){

        } else if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var response = xmlhttp.responseText;
            document.getElementById('to').value = '';
            alert('E-mail sent succesfull!');
        } else {
            alert('Give it a try again!');
        }
    };
    xmlhttp.open('POST', url + '/sendMail', true);
    xmlhttp.send(formData);
}