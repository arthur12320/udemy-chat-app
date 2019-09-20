const socket = io();

//elements
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $shareLocationButton = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages');

//templates 
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const { username,room } = Qs.parse(location.search, { ignoreQueryPrefix: true});


const autoscroll = () => {
    // new message element 
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}


socket.on('locationMessage',(msg)=>{
    console.log(msg);
    const html = Mustache.render(locationTemplate,{
        username: msg.username,
        url:msg.url,
        createdAt:moment(msg.createdAt).format('H:mm')
    })
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})


socket.on('message',(msg)=>{
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
});

socket.on('roomData', ({ room,users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    $messageFormButton.setAttribute('disabled','disabled');
    //disable
    const msg = e.target.elements.message.value

    socket.emit('sendMessage',msg,(err)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = ''
        $messageFormInput.focus();
        //enable
        if(err){
            return console.log(err);
        }
        console.log('message delivered')
    });
})


$shareLocationButton.addEventListener('click',() => {
    if(!navigator.geolocation){
        return alert('geolocation is not suported by your browser')
    }
    //disable
    $shareLocationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
       
        
        let cords = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }
        socket.emit('sendLocation',cords,()=>{
             //enable
             $shareLocationButton.removeAttribute('disabled');
            console.log('location shared')
        });
    })
})


socket.emit('join', {username,room},(error)=>{
    if(error){
        alert(error);
        location.href = '/';
    }
});