console.log("Deer's auth page.")
currentState = 'login'

const toggle_btn = document.getElementById('toggle-btn')
const title = document.querySelector('h1')
const inner_circle = toggle_btn.querySelector('div')
const submit_button = document.getElementById('auth')
const password2 = document.getElementById('password2')
const error_view = document.getElementById('error_message')

// Block login after n failed attempts in inteval ammount of secconds
const allowed_attemtps = 5 	// tries
const interval = 60    		// seconds
var login_attempts = JSON.parse(localStorage.getItem('attempts')) || [] 

console.log('Time passed', (new Date().getTime() - localStorage.getItem('blocked_at')) / 1000)

if (((new Date().getTime() - localStorage.getItem('blocked_at')) / 1000) > interval) {
	submit_button.style.visibility = 'visible'
	error_view.innerHTML = ''
	error_view.style.visibility = 'hidden'
} else {
	submit_button.style.visibility = 'hidden'
	console.log(parseInt((new Date().getTime() - localStorage.getItem('blocked_at')) / 1000))
	error_view.innerHTML = 'You have to wait ' +
		parseInt(interval - (new Date().getTime() - localStorage.getItem('blocked_at')) / 1000) +
		' seconds before being able to log in!' 
	error_view.style.visibility = 'visible'
}

var firebaseConfig = {
	apiKey: 'AIzaSyD51GbfHASRiQK7JNfWwt4D4EBHbIzk4p8',
	authDomain: 'deer-skrefi.firebaseapp.com',
	databaseURL: 'https://deer-skrefi.firebaseio.com',
	projectId: 'deer-skrefi',
	storageBucket: 'deer-skrefi.appspot.com',
	messagingSenderId: '477980180533',
	appId: '1:477980180533:web:2b73b822a7a3224d38317c',
	measurementId: 'G-MJJCJPQ376'
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig)

firebase.auth().signOut().then(() => {
	
}).catch(error => {
	console.log('Something went wrong.')
})

// Check when Login/Register Button is pressed.
const form = document.querySelector('form')
form.addEventListener('submit', (event) => {
	// error_view.innerHTML = ''
	// error_view.style.visibility = 'hidden'
	event.preventDefault()
	const formData = new FormData(form)
	const email = formData.get('email')
	const pass = formData.get('password')
	const pass2 = formData.get('password2')
	const auth = firebase.auth()

	var promise
	if (currentState == 'login') {
		promise = auth.signInWithEmailAndPassword(email, pass)
	} else {
		if (pass.toString() !== pass2.toString()){
			error_view.innerHTML = 'Passwords don\'t match.'
			error_view.style.visibility = null
		}
		promise = auth.createUserWithEmailAndPassword(email, pass)
	}
	// Treat exceptions, and by this I mean show the user a nice message
	promise.catch((e) => {
		const time = new Date().getTime()
		if (login_attempts.length > allowed_attemtps){
			const time_passed = (login_attempts[allowed_attemtps] - login_attempts[0]) / 1000 // seconds
			if (time_passed < interval){
				localStorage.setItem('blocked_at', new Date().getTime())
				submit_button.style.visibility = 'hidden'
				error_view.style.visibility = null
				error_view.innerHTML = 'Too many attempts in a short period of time, please wait ' + interval + ' seconds before logging in again'
				localStorage.removeItem('attempts')
				return
			}
			login_attempts.shift()
		}
		login_attempts.push(time)
		localStorage.setItem('attempts', JSON.stringify(login_attempts))

		console.log(e)
		error_view.innerHTML = e.message
		// if (error_view.innerHTML != ''){
		// 	error_view.style.visibility = null
		// }
	})
})

firebase.auth().onAuthStateChanged(user => {
	if (user) window.location = '../index.html'
})

function changeState() {
	error_view.innerHTML = ''
	error_view.style.visibility = 'hidden'
	if (currentState == 'login') {
		title.innerHTML = 'Register'
		toggle_btn.classList.add('active')
		currentState = 'register'
		inner_circle.innerHTML = 'Register'
		submit_button.setAttribute('value', 'Register')
		password2.style.visibility = null
	} else {
		title.innerHTML = 'Login'
		toggle_btn.classList.remove('active')
		currentState = 'login'
		inner_circle.innerHTML = 'Login'
		submit_button.setAttribute('value', 'Login')
		password2.style.visibility = 'hidden'
	}
}