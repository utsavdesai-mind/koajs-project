document.addEventListener("DOMContentLoaded", () => {
    const API_VERSION = "v2";
    const API_BASE_URL = `/api/${API_VERSION}`;
    const DEFAULT_AVATAR = "/person.jpg";

    const authSection = document.getElementById("auth-section");
    const profileSection = document.getElementById("profile-section");
    const authForm = document.getElementById("auth-form");
    const toggleAuth = document.getElementById("toggle-auth");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const authBtn = document.getElementById("auth-btn");
    const nameGroup = document.getElementById("name-group");
    const ageGroup = document.getElementById("age-group");
    const toggleText = document.getElementById("toggle-text");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const ageInput = document.getElementById("age");

    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileAge = document.getElementById("profile-age");
    const profilePassword = document.getElementById("profile-password");
    const updateBtn = document.getElementById("update-btn");
    const deleteBtn = document.getElementById("delete-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const profileImgPreview = document.getElementById("profile-img-preview");
    const profilePicInput = document.getElementById("profile-pic-input");
    const changePicBtn = document.getElementById("change-pic-btn");
    const deletePicBtn = document.getElementById("delete-pic-btn");
    const avatarWrapper = document.querySelector(".avatar-wrapper");

    const fieldErrors = {
        name: document.getElementById("name-error"),
        email: document.getElementById("email-error"),
        password: document.getElementById("password-error"),
        age: document.getElementById("age-error")
    };

    let isLogin = true;
    let currentUser = null;
    let token = localStorage.getItem("token");
    let activeToastTimeout = null;
    let originalData = {
        name: "",
        age: "",
        password: ""
    };

    const getAuthToken = (data = {}) => data.token || data.accessToken || null;
    const getUserPayload = (data = {}) => data.user || data;
    const getProfileImagePath = (data = {}) => data.profilePicture || data.image?.path || "";

    document.querySelectorAll(".password-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const targetInput = document.getElementById(button.dataset.target);
            const isPassword = targetInput.type === "password";
            targetInput.type = isPassword ? "text" : "password";
            button.querySelector(".toggle-text").textContent = isPassword ? "Hide" : "Show";
            button.setAttribute("aria-label", `${isPassword ? "Hide" : "Show"} password`);
        });
    });

    ["input", "change"].forEach((eventName) => {
        [nameInput, emailInput, passwordInput, ageInput].forEach((input) => {
            input.addEventListener(eventName, () => clearFieldError(input.id));
        });
    });

    if (token) {
        checkAuth();
    }

    toggleAuth.addEventListener("click", (e) => {
        e.preventDefault();
        setAuthMode(!isLogin);
    });

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFormErrors();

        const payload = getAuthPayload();
        if (!payload) {
            return;
        }

        const endpoint = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/register`;
        setButtonLoading(authBtn, true, isLogin ? "Signing in..." : "Creating account...");

        try {
            const responseBody = await request(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (isLogin) {
                token = getAuthToken(responseBody.data);
                currentUser = getUserPayload(responseBody.data);
                localStorage.setItem("token", token);
                localStorage.setItem("userId", currentUser.id);
                resetAuthForm();
                showToast(`Welcome back, ${currentUser.name}.`, "success");
                showProfile(currentUser);
                return;
            }

            showToast("Account created successfully. Please sign in with your new credentials.", "success");
            setAuthMode(true);
            passwordInput.focus();
        } catch (err) {
            handleApiError(err);
        } finally {
            setButtonLoading(authBtn, false, isLogin ? "Login" : "Sign Up");
        }
    });

    updateBtn.addEventListener("click", async () => {
        const userId = localStorage.getItem("userId");
        const hasPasswordChanged = !!profilePassword.value.trim();
        const payload = {
            name: profileName.value.trim(),
            age: profileAge.value ? Number(profileAge.value) : null
        };

        if (hasPasswordChanged) {
            payload.password = profilePassword.value.trim();
        }

        setButtonLoading(updateBtn, true, "Saving...");
        let updateSuccessful = false;

        try {
            const responseBody = await request(`${API_BASE_URL}/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            updateSuccessful = true;

            if (hasPasswordChanged) {
                performLogout("Password updated successfully. Please sign in with your new password.");
                return;
            }

            const updatedUser = getUserPayload(responseBody.data);
            currentUser = { ...currentUser, ...updatedUser };
            profilePassword.value = "";
            syncProfileState(currentUser);
            showToast("Profile details saved successfully.", "success");
        } catch (err) {
            showToast(err.message || "We could not update your profile. Please try again.", "error");
        } finally {
            if (!updateSuccessful || !hasPasswordChanged) {
                setButtonLoading(updateBtn, false, "Update Profile");
                checkChanges();
            }
        }
    });

    [profileName, profileAge, profilePassword].forEach((input) => {
        input.addEventListener("input", checkChanges);
    });

    deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete your account permanently? This action cannot be undone.")) {
            return;
        }

        const userId = localStorage.getItem("userId");
        setButtonLoading(deleteBtn, true, "Deleting...");

        try {
            await request(`${API_BASE_URL}/users/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            performLogout("Your account has been deleted successfully.");
        } catch (err) {
            showToast(err.message || "We could not delete your account right now.", "error");
        } finally {
            setButtonLoading(deleteBtn, false, "Delete Account");
        }
    });

    changePicBtn.addEventListener("click", () => profilePicInput.click());

    profilePicInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        const clientValidationError = validateImage(file);
        if (clientValidationError) {
            resetProfileImageInput();
            showToast(clientValidationError, "error");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        avatarWrapper.classList.add("is-uploading");

        try {
            const responseBody = await request(`${API_BASE_URL}/users/upload-profile`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const profilePicture = getProfileImagePath(responseBody.data);
            if (currentUser) {
                currentUser.profilePicture = profilePicture;
            }
            setProfileImage(profilePicture);
            showToast("Profile picture updated successfully.", "success");
        } catch (err) {
            showToast(err.message || "Image upload failed. Please try another file.", "error");
        } finally {
            avatarWrapper.classList.remove("is-uploading");
            resetProfileImageInput();
        }
    });

    deletePicBtn.addEventListener("click", async () => {
        if (!confirm("Remove your current profile picture?")) {
            return;
        }

        try {
            await request(`${API_BASE_URL}/users/profile/image`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (currentUser) {
                currentUser.profilePicture = "";
            }
            setProfileImage("");
            resetProfileImageInput();
            showToast("Profile picture removed.", "success");
        } catch (err) {
            showToast(err.message || "We could not remove the profile picture.", "error");
        }
    });

    logoutBtn.addEventListener("click", () => performLogout("You have been logged out."));

    function setAuthMode(loginMode) {
        isLogin = loginMode;
        resetAuthForm();

        authTitle.innerText = isLogin ? "Welcome Back" : "Create Account";
        authSubtitle.innerText = isLogin
            ? "Please login to continue"
            : "Join us today and get started";
        authBtn.innerText = isLogin ? "Login" : "Sign Up";
        nameGroup.style.display = isLogin ? "none" : "block";
        ageGroup.style.display = isLogin ? "none" : "block";
        toggleText.innerText = isLogin ? "Don't have an account?" : "Already have an account?";
        toggleAuth.innerText = isLogin ? "Sign Up" : "Login";
    }

    function getAuthPayload() {
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        const name = nameInput.value.trim();
        const age = ageInput.value.trim();
        const errors = {};

        if (!email) {
            errors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Enter a valid email address.";
        }

        if (!password) {
            errors.password = "Password is required.";
        } else if (!isLogin && password.length < 6) {
            errors.password = "Password must be at least 6 characters.";
        }

        if (!isLogin) {
            if (!name) {
                errors.name = "Full name is required.";
            } else if (name.length < 3) {
                errors.name = "Full name must be at least 3 characters.";
            }

            if (age) {
                const parsedAge = Number(age);
                if (!Number.isInteger(parsedAge) || parsedAge < 1) {
                    errors.age = "Age must be a valid positive number.";
                }
            }
        }

        if (Object.keys(errors).length) {
            setFormErrors(errors);
            const firstErrorField = Object.keys(errors)[0];
            document.getElementById(firstErrorField).focus();
            return null;
        }

        return isLogin
            ? { email, password }
            : {
                name,
                email,
                password,
                ...(age ? { age: Number(age) } : {})
            };
    }

    function validateImage(file) {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return "Please upload a JPG, PNG, or WEBP image.";
        }

        if (file.size > 2 * 1024 * 1024) {
            return "Image must be smaller than 2MB.";
        }

        return "";
    }

    function syncProfileState(user) {
        showProfile(user);
        originalData = {
            name: user.name || "",
            age: (user.age || "").toString(),
            password: ""
        };
    }

    function checkChanges() {
        const hasNameChanged = profileName.value.trim() !== originalData.name;
        const hasAgeChanged = profileAge.value.toString() !== originalData.age;
        const hasPasswordChanged = profilePassword.value.trim() !== "";

        updateBtn.disabled = !(hasNameChanged || hasAgeChanged || hasPasswordChanged);
    }

    function resetAuthForm() {
        authForm.reset();
        clearFormErrors();
        document.querySelectorAll(".password-toggle .toggle-text").forEach((node) => {
            node.textContent = "Show";
        });
        [passwordInput, profilePassword].forEach((input) => {
            input.type = "password";
        });
    }

    function resetProfileImageInput() {
        profilePicInput.value = "";
    }

    function setProfileImage(profilePicture) {
        profileImgPreview.src = profilePicture ? `/${profilePicture}` : DEFAULT_AVATAR;
        deletePicBtn.style.display = profilePicture ? "flex" : "none";
    }

    function performLogout(message = "You have been logged out.") {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        token = null;
        currentUser = null;
        resetProfileImageInput();
        profileSection.style.display = "none";
        authSection.style.display = "block";
        setAuthMode(true);
        showToast(message, "success");
    }

    function showProfile(user) {
        authSection.style.display = "none";
        profileSection.style.display = "block";

        profileName.value = user.name || "";
        profileEmail.value = user.email || "";
        profileAge.value = user.age || "";
        profilePassword.value = "";
        setProfileImage(user.profilePicture || "");

        originalData = {
            name: user.name || "",
            age: (user.age || "").toString(),
            password: ""
        };
        checkChanges();
    }

    async function checkAuth() {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            return;
        }

        try {
            const responseBody = await request(`${API_BASE_URL}/users/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            currentUser = getUserPayload(responseBody.data);
            showProfile(currentUser);
        } catch (err) {
            performLogout("Your session has expired. Please sign in again.");
        }
    }

    async function request(url, options = {}) {
        const res = await fetch(url, options);
        let responseBody = {};

        try {
            responseBody = await res.json();
        } catch (error) {
            responseBody = {};
        }

        if (!res.ok) {
            const err = new Error(responseBody.message || "Something went wrong. Please try again.");
            err.status = res.status;
            err.details = responseBody.details || [];
            throw err;
        }

        return responseBody;
    }

    function handleApiError(err) {
        if (Array.isArray(err.details) && err.details.length) {
            setFormErrors(mapApiErrorsToFields(err.details));
        }

        showToast(err.message || "Something went wrong. Please try again.", "error");
    }

    function mapApiErrorsToFields(details) {
        return details.reduce((accumulator, detail) => {
            if (!detail.field) {
                return accumulator;
            }

            accumulator[detail.field] = detail.message;
            return accumulator;
        }, {});
    }

    function setFormErrors(errors) {
        Object.entries(errors).forEach(([field, message]) => {
            const input = document.getElementById(field);
            const errorNode = fieldErrors[field];

            if (input) {
                input.classList.add("input-invalid");
            }

            if (errorNode) {
                errorNode.textContent = message;
            }
        });
    }

    function clearFormErrors() {
        Object.keys(fieldErrors).forEach(clearFieldError);
    }

    function clearFieldError(field) {
        const input = document.getElementById(field);
        const errorNode = fieldErrors[field];

        if (input) {
            input.classList.remove("input-invalid");
        }

        if (errorNode) {
            errorNode.textContent = "";
        }
    }

    function setButtonLoading(button, loading, text) {
        button.disabled = loading;
        button.classList.toggle("loading", loading);
        button.textContent = text;
    }

    function showToast(message, type = "success") {
        const toast = document.getElementById("toast");
        toast.innerText = message;
        toast.className = `toast show ${type}`;

        window.clearTimeout(activeToastTimeout);
        activeToastTimeout = window.setTimeout(() => {
            toast.className = "toast";
        }, 3500);
    }
});
