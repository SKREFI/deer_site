// ----- SETUP -----
console.log("Deer's up!");
//geting the firebase user from the local storage !!! NOT WORKING !! :(

// ----- CONSTANTS -----
const BASE_URL = 'http://localhost:8080' 	    // local host
// const BASE_URL = 'http://bc37039ee998.ngrok.io' 	// ngrok app URL
// const BASE_URL = 'http://34.107.45.244:8080'		// GCP VM Instance Link

// ----- HTML Views -----
const form = document.getElementById('post_form');
const loadingElement = document.querySelector('.loading'); // Loading GIF
loadingElement.style.display = 'none'; // Hiding the loading GIF
const postsElement = document.querySelector('.posts-container');

// Navigation Bar Buttons
const admin_button = document.getElementById('admin_button');
const chat_button = document.getElementById('chat_button');
const points_button = document.getElementById('points_button');
const logout_button = document.getElementById('logout_button');

// Comments Modal Constants
const modal_header = document.querySelector('#post-modal-content .modal-header') 	// used to set th
const modal_body = document.querySelector('#post-modal-content .modal-body') 	// used to set/display comments
const comment_form = document.getElementById('comment_form');
const comment_send_button = document.getElementById('comment_send_button')

loadingElement.style.display = null;

// ----- Functions -----

// Checking if guest
function isGuest(message = '') {
	if (uid === 'guest' || uid == undefined) {
		if (message.length > 0) showSnack(message);
		return true;
	}
	return false;
}

function showHide(show, hide) {
	if (show) show.style.display = null;
	if (hide) hide.style.display = 'none';
}

const snackbar = document.getElementById('snackbar');
function showSnack(message, seconds = 3) {
	snackbar.textContent = message;
	snackbar.className = 'show';
	setTimeout(function () {
		snackbar.className = snackbar.className.replace('show', '');
	}, 1000 * seconds);
}

// Geting UID from indexedDB
var uid = 'guest'
var objectStore
const request = window.indexedDB.open('firebaseLocalStorageDb')
request.onerror = function (event) {
	console.err('Event fething indexDB', event)
};

var isAdmin = null
request.onsuccess = function (dbEvent) {
	const db = request.result;
	const transaction = db.transaction(['firebaseLocalStorage'])
	objectStore = transaction.objectStore('firebaseLocalStorage')
	if ('getAll' in objectStore) {
		objectStore.getAll().onsuccess = function (getAllEvent) {
			// event.target.result = a list of elements
			// .value is the hole user object
			uid = event.target.result[event.target.result.length - 1].value.uid

			if (isAdmin == null) {
				fetch(BASE_URL + '/isadmin', {
					method: 'POST',
					body: JSON.stringify({ uid: uid }),
					headers: {
						'content-type': 'application/json'
					}
				})
					.then(response => response.json())
					.then(response => {
						if (response)
							admin_button.classList.remove('hidden')
					})
			}
		};
	}
};


// ----- Main - Navbar -----
const admin_modal_body = document.querySelector('#admin-modal .modal-body')
const admin_modal_form_button = document.querySelector('#admin-modal button')
const admin_form = document.getElementById('admin_form')

admin_button.addEventListener('click', () => {
	$('#admin-modal').modal()
	
	admin_modal_body.innerHTML = ''

	fetch(BASE_URL + '/admins?uid=' + uid)
		.then(response => response.json())
		.then(response => {
			response.forEach(item => {
				const uid_element = '<div class="comment"><div><p>' + item + '</p><img style="margin-left: auto;" src="src/tdot.svg"></div></div>'  
				admin_modal_body.innerHTML += uid_element
			})
		})
	
	admin_modal_form_button.onclick = (e) => {
		e.stopPropagation()
		e.preventDefault()
		const formData = new FormData(admin_form); // Getting the data from the from
		const content = formData.get('content');
		fetch(BASE_URL + '/addadmin?uid=' + uid, {
			method: 'POST',
			body: JSON.stringify({ uid: content }),
			headers: {
				'content-type': 'application/json'
			}
		}).then(response => response.json())
			.then(response => {
				if (response == 'already'){
					showSnack('User is already an admin')
				} else {
					const uid_element = '<div class="comment"><div><p>' + content + '</p></div></div>'
					admin_modal_body.innerHTML += uid_element
				}
			})
	}
});

chat_button.addEventListener('click', () => {
	showSnack('Chat Pressed');
});
points_button.addEventListener('click', () => {
	showSnack('Points Pressed');
});
logout_button.addEventListener('click', () => {
	// redirect to auth page where we log out anyways
	window.location = 'auth/index.html';
});

// ----- Main - Posts -----
getAllPosts();

// Handle New Post
form.addEventListener('submit', (event) => {
	event.preventDefault();
	if (isGuest("You can't post as a guest. Please login!")) {
		return;
	}
	const formData = new FormData(form); // Getting the data from the from
	const content = formData.get('content');

	const package = { uid, content, likesFrom: [uid] }; // Creating a new object with the data

	// Called when posting something
	fetch(BASE_URL + '/post', {
		method: 'POST',
		body: JSON.stringify(package),
		headers: {
			'content-type': 'application/json'
		}
	})
		.then((response) => response.json())
		.then((response) => {
			if (response.message === 'Content too short.') {
				showSnack(response.message)
				return
			}
			form.reset();
			getAllPosts();
		})
})


function getAllPosts() {
	postsElement.innerHTML = '';
	showHide(loadingElement, null);
	// GET Request to get the list of posts
	fetch(BASE_URL + '/posts').then((response) => response.json()).then((posts) => {
		posts.reverse();
		posts.forEach((post) => {
			// Creating the 'post' container (the samll container in the list)
			const postDiv = document.createElement('div');
			postDiv.classList.add('post');
			postDiv.onclick = (e) => {
				// Whole post pressed
				e.stopPropagation();
				// Opening the modal
				$('#comments-modal').modal();

				// set the modal header
				const modal_comment_post = '<div class="post"><div><img src="https://robohash.org/' + post.uid + '_' + post._id + '"><p>' + post.content + '</p></div></div>'
				modal_header.innerHTML = modal_comment_post

				// get comments
				modal_body.innerHTML = ''
				fetch(BASE_URL + '/comments?pid=' + post._id)
					.then(response => response.json())
					.then(response => {
						if (response.length) {
							response = JSON.parse(response)
							response.forEach(comment => {
								const comment_element = '<div class="comment"><div><img src="https://robohash.org/' + comment.uid + '_' + post._id + '"><p>' + comment.content + '</p></div></div>'
								modal_body.innerHTML += comment_element
							})
						}
					})

				comment_send_button.onclick = e => {
					e.stopPropagation()
					e.preventDefault()
					if (isGuest("You can't comment as a guest. Please login!")) {
						return;
					}

					const formData = new FormData(comment_form);
					const content = formData.get('content'); // comment text basically

					const pid = post._id
					const comment = { pid, uid, content };

					comment_form.reset()
					fetch(BASE_URL + '/comment', {
						method: 'POST',
						body: JSON.stringify(comment),
						headers: {
							'content-type': 'application/json'
						}
					})  .then(response => response.json())
						.then(response => {
							if (response === "done") {
								const comment_element = '<div class="comment"><div><img src="https://robohash.org/' + uid + '_' + pid + '"><p>' + content + '</p></div></div>'
								modal_body.innerHTML += comment_element
							} else {
								showSnack(response.message)
							}
						})
				}
			}

			const firstDiv = document.createElement('div');

			// Auto generated image
			const img = document.createElement('img')
			img.setAttribute('src', 'https://robohash.org/' + post.uid + '_' + post._id)
			firstDiv.appendChild(img);

			// Paragraph which contains the content
			const pContent = document.createElement('p')
			pContent.textContent = post.content
			firstDiv.appendChild(pContent)

			// 3 Dots Menu on the right
			const dotsElem = document.createElement('img')
			dotsElem.setAttribute('src', 'src/tdot.svg')
			dotsElem.onclick = (e) => {
				e.stopPropagation()

				fetch(BASE_URL + '/delete', {
					method: 'POST',
					body: JSON.stringify({
						_id: post._id,
						uid: uid
					}),
					headers: {
						'content-type': 'application/json'
					}
				})
					.then((response) => response.json())
					.then((response) => {
						console.log(response)
						getAllPosts()
					});
			};
			firstDiv.appendChild(dotsElem)

			//Second Div which contains the likes and buttons
			const secDiv = document.createElement('div')
			secDiv.classList.add('likes_section')

			// Meh Button
			const mehBtn = document.createElement('button')
			mehBtn.innerHTML = 'Meh'
			mehBtn.onclick = (e) => {
				e.stopPropagation();
				if (isGuest('As a guest, you can only lurk arround.')) {
					return;
				}
				fetch(BASE_URL + '/meh', {
					method: 'POST',
					body: JSON.stringify({
						me: uid,
						post: post
					}),
					headers: {
						'content-type': 'application/json'
					}
				})
					.then((response) => response.json())
					.then((response) => {
						if (response.message == 'updated') getAllPosts();
						else if (response.message == 'already') showSnack('You have already disliked this post.');
						else if (response.message == 'own_post') showSnack("You can't alter your own post.");
					});
			};
			secDiv.appendChild(mehBtn);

			const likesP = document.createElement('p');
			likesP.innerHTML = post.likesFrom.length - post.mehsFrom.length;
			secDiv.appendChild(likesP);

			// Cool Button = Like Button
			const coolBtn = document.createElement('button');
			coolBtn.innerHTML = 'Cool';
			coolBtn.onclick = (e) => {
				e.stopPropagation();
				if (isGuest('As a guest, you can only lurk arround.')) {
					return;
				}
				fetch(BASE_URL + '/cool', {
					method: 'POST',
					body: JSON.stringify({
						me: uid,
						post: post
					}),
					headers: {
						'content-type': 'application/json'
					}
				})
					.then((response) => response.json())
					.then((response) => {
						if (response.message == 'updated') getAllPosts();
						else if (response.message == 'already') showSnack('You have already liked this post.');
						else if (response.message == 'own_post') showSnack("You can't alter your own post.");
					});
			};

			secDiv.appendChild(coolBtn);

			// Last step is adding the new created post to the list
			postDiv.appendChild(firstDiv);
			postDiv.appendChild(secDiv);
			postsElement.appendChild(postDiv);
		});
	});
	showHide(null, loadingElement);
}

// function getComments(pid){
// 	fetch(BASE_URL + '/comments?pid=' + pid)
// 		.then(response => response.json())
// 		.then((res) => {
// 			return res
// 		})
// }