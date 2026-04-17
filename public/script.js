document.addEventListener('DOMContentLoaded', () => {
    const API_VERSION = 'v2';
    const API_BASE_URL = `/api/${API_VERSION}`;

    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');
    const authForm = document.getElementById('auth-form');
    const toggleAuth = document.getElementById('toggle-auth');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authBtn = document.getElementById('auth-btn');
    const nameGroup = document.getElementById('name-group');
    const ageGroup = document.getElementById('age-group');
    const toggleText = document.getElementById('toggle-text');

    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAge = document.getElementById('profile-age');
    const profilePassword = document.getElementById('profile-password');
    const updateBtn = document.getElementById('update-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImgPreview = document.getElementById('profile-img-preview');
    const profilePicInput = document.getElementById('profile-pic-input');
    const changePicBtn = document.getElementById('change-pic-btn');
    const deletePicBtn = document.getElementById('delete-pic-btn');

    let isLogin = true;
    let currentUser = null;
    let token = localStorage.getItem('token');
    let originalData = {
        name: '',
        age: '',
        password: ''
    };

    const getAuthToken = (data = {}) => data.token || data.accessToken || null;
    const getUserPayload = (data = {}) => data.user || data;
    const getProfileImagePath = (data = {}) =>
        data.profilePicture || data.image?.path || '';

    // Initial State Check
    if (token) {
        checkAuth();
    }

    // Toggle between Login and Sign Up
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;

        if (isLogin) {
            authTitle.innerText = 'Welcome Back';
            authSubtitle.innerText = 'Please login to continue';
            authBtn.innerText = 'Login';
            nameGroup.style.display = 'none';
            ageGroup.style.display = 'none';
            toggleText.innerText = "Don't have an account?";
            toggleAuth.innerText = 'Sign Up';
        } else {
            authTitle.innerText = 'Create Account';
            authSubtitle.innerText = 'Join us today and get started';
            authBtn.innerText = 'Sign Up';
            nameGroup.style.display = 'block';
            ageGroup.style.display = 'block';
            toggleText.innerText = "Already have an account?";
            toggleAuth.innerText = 'Login';
        }
    });

    // Handle Auth Submit
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;

        const endpoint = isLogin
            ? `${API_BASE_URL}/auth/login`
            : `${API_BASE_URL}/auth/register`;
        const payload = isLogin ? { email, password } : { name, email, password, age: parseInt(age) };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseBody = await res.json();

            if (!res.ok) throw new Error(responseBody.message || 'Something went wrong');

            showToast(isLogin ? 'Login Successful' : 'Registration Successful');

            if (isLogin) {
                token = getAuthToken(responseBody.data);
                currentUser = getUserPayload(responseBody.data);
                localStorage.setItem('token', token);
                localStorage.setItem('userId', currentUser.id);
                showProfile(currentUser);
            } else {
                // After signup, switch to login
                toggleAuth.click();
            }
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // Handle Profile Update
    updateBtn.addEventListener('click', async () => {
        const userId = localStorage.getItem('userId');
        const payload = {
            name: profileName.value,
            age: profileAge.value ? parseInt(profileAge.value) : null
        };

        if (profilePassword.value) {
            payload.password = profilePassword.value;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const responseBody = await res.json();
            if (!res.ok) throw new Error(responseBody.message || 'Update failed');

            showToast('Profile updated successfully');

            // Update original data to match new state
            originalData = {
                name: profileName.value,
                age: profileAge.value.toString(),
                password: ''
            };
            profilePassword.value = '';
            checkChanges();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // Handle detecting changes
    function checkChanges() {
        const hasNameChanged = profileName.value !== originalData.name;
        const hasAgeChanged = profileAge.value.toString() !== originalData.age;
        const hasPasswordChanged = profilePassword.value !== '';

        updateBtn.disabled = !(hasNameChanged || hasAgeChanged || hasPasswordChanged);
    }

    [profileName, profileAge, profilePassword].forEach(input => {
        input.addEventListener('input', checkChanges);
    });

    // Handle Delete Account
    deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        const userId = localStorage.getItem('userId');
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const responseBody = await res.json();
            if (!res.ok) throw new Error(responseBody.message || 'Delete failed');

            showToast('Account deleted');
            logout();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // Handle Image Upload
    changePicBtn.addEventListener('click', () => profilePicInput.click());

    profilePicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_BASE_URL}/users/upload-profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const responseBody = await res.json();
            if (!res.ok) throw new Error(responseBody.message || 'Upload failed');

            showToast('Profile picture updated');
            const profilePicture = getProfileImagePath(responseBody.data);
            profileImgPreview.src = profilePicture ? `/${profilePicture}` : '/person.jpg';
            deletePicBtn.style.display = 'flex';
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // Handle Image Delete
    deletePicBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete your profile picture?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/users/profile/image`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const responseBody = await res.json();
            if (!res.ok) throw new Error(responseBody.message || 'Delete failed');

            showToast('Profile picture deleted');
            profileImgPreview.src = '/person.jpg';
            deletePicBtn.style.display = 'none';
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // Logout Helper
    logoutBtn.addEventListener('click', logout);

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        token = null;
        currentUser = null;
        profileSection.style.display = 'none';
        authSection.style.display = 'block';
        showToast('Logged out');
    }

    function showProfile(user) {
        authSection.style.display = 'none';
        profileSection.style.display = 'block';

        profileName.value = user.name;
        profileEmail.value = user.email;
        profileAge.value = user.age || '';

        if (user.profilePicture) {
            profileImgPreview.src = `/${user.profilePicture}`;
            deletePicBtn.style.display = 'flex';
        } else {
            profileImgPreview.src = '/person.jpg';
            deletePicBtn.style.display = 'none';
        }

        // Initialize original data for change detection
        originalData = {
            name: user.name,
            age: (user.age || '').toString(),
            password: ''
        };
        checkChanges();
    }

    async function checkAuth() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const responseBody = await res.json();

            if (res.ok) {
                showProfile(getUserPayload(responseBody.data));
            } else {
                logout();
            }
        } catch (err) {
            logout();
        }
    }


    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.className = 'toast show' + (isError ? ' error' : '');

        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
});
