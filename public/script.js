document.addEventListener("DOMContentLoaded", () => {
    const API_VERSION = "v2";
    const API_BASE_URL = `/api/${API_VERSION}`;
    const DEFAULT_AVATAR = "/person.jpg";

    const container = document.querySelector(".container");
    const authSection = document.getElementById("auth-section");
    const profileSection = document.getElementById("profile-section");
    const authForm = document.getElementById("auth-form");
    const toggleAuth = document.getElementById("toggle-auth");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const authBtn = document.getElementById("auth-btn");
    const nameGroup = document.getElementById("name-group");
    const ageGroup = document.getElementById("age-group");
    const signupPictureGroup = document.getElementById("signup-picture-group");
    const toggleText = document.getElementById("toggle-text");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const ageInput = document.getElementById("age");
    const signupProfilePicInput = document.getElementById("signup-profile-pic");
    const signupProfilePreview = document.getElementById("signup-profile-preview");
    const clearSignupImageBtn = document.getElementById("clear-signup-image");

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
        age: document.getElementById("age-error"),
        profilePicture: document.getElementById("profilePicture-error")
    };

    let isLogin = true;
    let currentUser = null;
    let token = getCookie("token");
    let activeToastTimeout = null;
    let isProfileBusy = false;
    let isProfilePasswordDirty = false;
    let signupPreviewUrl = "";
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
        [nameInput, emailInput, passwordInput, ageInput, signupProfilePicInput].forEach((input) => {
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
            const requestOptions = {
                method: "POST"
            };

            if (isLogin) {
                requestOptions.headers = { "Content-Type": "application/json" };
                requestOptions.body = JSON.stringify(payload);
            } else {
                const formData = new FormData();
                formData.append("name", payload.name);
                formData.append("email", payload.email);
                formData.append("password", payload.password);

                if (payload.age !== undefined) {
                    formData.append("age", String(payload.age));
                }

                if (signupProfilePicInput.files[0]) {
                    formData.append("profilePicture", signupProfilePicInput.files[0]);
                }

                requestOptions.body = formData;
            }

            const responseBody = await request(endpoint, requestOptions);

            if (isLogin) {
                token = getAuthToken(responseBody.data);
                currentUser = getUserPayload(responseBody.data);
                setCookie("token", token);
                setCookie("userId", currentUser.id);
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
        const userId = getCookie("userId");
        if (!userId || isProfileBusy) {
            return;
        }

        const hasPasswordChanged = isProfilePasswordDirty && !!profilePassword.value.trim();
        const payload = {
            name: profileName.value.trim(),
            age: profileAge.value ? Number(profileAge.value) : null
        };

        if (hasPasswordChanged) {
            payload.password = profilePassword.value.trim();
        }

        isProfileBusy = true;
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
            isProfilePasswordDirty = false;
            syncProfileState(currentUser);
            showToast("Profile details saved successfully.", "success");
        } catch (err) {
            showToast(err.message || "We could not update your profile. Please try again.", "error");
        } finally {
            isProfileBusy = false;
            if (!updateSuccessful || !hasPasswordChanged) {
                setButtonLoading(updateBtn, false, "Update Profile");
                checkChanges();
            }
        }
    });

    [profileName, profileAge, profilePassword].forEach((input) => {
        input.addEventListener("input", checkChanges);
    });

    profilePassword.addEventListener("input", () => {
        isProfilePasswordDirty = true;
    });

    deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete your account permanently? This action cannot be undone.")) {
            return;
        }

        const userId = getCookie("userId");
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

    changePicBtn.addEventListener("click", () => {
        if (!isProfileBusy) {
            profilePicInput.click();
        }
    });

    signupProfilePicInput.addEventListener("change", () => {
        const file = signupProfilePicInput.files[0];
        clearFieldError("profilePicture");

        if (!file) {
            resetSignupImage();
            return;
        }

        const clientValidationError = validateImage(file);
        if (clientValidationError) {
            setFormErrors({ profilePicture: clientValidationError });
            resetSignupImage();
            return;
        }

        if (signupPreviewUrl) {
            URL.revokeObjectURL(signupPreviewUrl);
        }

        signupPreviewUrl = URL.createObjectURL(file);
        signupProfilePreview.src = signupPreviewUrl;
    });

    clearSignupImageBtn.addEventListener("click", () => {
        resetSignupImage();
        clearFieldError("profilePicture");
    });

    profilePicInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file || isProfileBusy) {
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
        isProfileBusy = true;
        avatarWrapper.classList.add("is-uploading");
        setButtonLoading(updateBtn, true, "Saving...");

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
            isProfileBusy = false;
            avatarWrapper.classList.remove("is-uploading");
            setButtonLoading(updateBtn, false, "Update Profile");
            checkChanges();
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

        container.classList.toggle("signup-active", !isLogin);
        authSection.classList.toggle("signup-layout", !isLogin);
        authTitle.innerText = isLogin ? "Welcome Back" : "Create Account";
        authSubtitle.innerText = isLogin
            ? "Please login to continue"
            : "Join us today and get started";
        authBtn.innerText = isLogin ? "Login" : "Sign Up";
        passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
        nameGroup.style.display = isLogin ? "none" : "block";
        ageGroup.style.display = isLogin ? "none" : "block";
        signupPictureGroup.style.display = isLogin ? "none" : "block";
        toggleText.innerText = isLogin ? "Don't have an account?" : "Already have an account?";
        toggleAuth.innerText = isLogin ? "Sign Up" : "Login";
    }

    function getAuthPayload() {
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        const name = nameInput.value.trim();
        const age = ageInput.value.trim();
        const signupImage = signupProfilePicInput.files[0];
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

            if (signupImage) {
                const imageError = validateImage(signupImage);
                if (imageError) {
                    errors.profilePicture = imageError;
                }
            }
        }

        if (Object.keys(errors).length) {
            setFormErrors(errors);
            const firstErrorField = Object.keys(errors)[0];
            const firstFieldNode = document.getElementById(firstErrorField);
            if (firstFieldNode) {
                firstFieldNode.focus();
            }
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
        const hasPasswordChanged = isProfilePasswordDirty && profilePassword.value.trim() !== "";

        updateBtn.disabled = isProfileBusy || !(hasNameChanged || hasAgeChanged || hasPasswordChanged);
    }

    function resetAuthForm() {
        authForm.reset();
        clearFormErrors();
        resetSignupImage();
        document.querySelectorAll(".password-toggle .toggle-text").forEach((node) => {
            node.textContent = "Show";
        });
        [passwordInput, profilePassword].forEach((input) => {
            input.type = "password";
        });
        isProfilePasswordDirty = false;
    }

    function resetProfileImageInput() {
        profilePicInput.value = "";
    }

    function resetProfileActionState() {
        isProfileBusy = false;
        setButtonLoading(updateBtn, false, "Update Profile");
    }

    function resetSignupImage() {
        if (signupPreviewUrl) {
            URL.revokeObjectURL(signupPreviewUrl);
            signupPreviewUrl = "";
        }

        signupProfilePicInput.value = "";
        signupProfilePreview.src = DEFAULT_AVATAR;
    }

    function setProfileImage(profilePicture) {
        profileImgPreview.src = profilePicture ? `/${profilePicture}` : DEFAULT_AVATAR;
        deletePicBtn.style.display = profilePicture ? "flex" : "none";
    }

    function performLogout(message = "You have been logged out.") {
        deleteCookie("token");
        deleteCookie("userId");
        token = null;
        currentUser = null;
        resetProfileActionState();
        isProfilePasswordDirty = false;
        resetProfileImageInput();
        profileSection.style.display = "none";
        authSection.style.display = "block";
        setAuthMode(true);
        showToast(message, "success");
    }

    function showProfile(user) {
        resetProfileActionState();
        authSection.style.display = "none";
        profileSection.style.display = "block";

        profileName.value = user.name || "";
        profileEmail.value = user.email || "";
        profileAge.value = user.age || "";
        profilePassword.value = "";
        setProfileImage(user.profilePicture || "");
        isProfilePasswordDirty = false;

        originalData = {
            name: user.name || "",
            age: (user.age || "").toString(),
            password: ""
        };
        checkChanges();
    }

    async function checkAuth() {
        const userId = getCookie("userId");
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
        const res = await fetch(url, {
            credentials: "same-origin",
            ...options
        });
        let responseBody = {};

        try {
            responseBody = await res.json();
        } catch (error) {
            responseBody = {};
        }

        if (!res.ok) {
            const err = new Error(responseBody.message || "Something went wrong. Please try again.");
            err.status = res.status;
            err.details = responseBody.metadata?.details || responseBody.details || [];
            throw err;
        }

        return responseBody;
    }

    function handleApiError(err) {
        if (Array.isArray(err.details) && err.details.length) {
            const fieldLevelErrors = mapApiErrorsToFields(err.details);
            setFormErrors(fieldLevelErrors);

            const firstErrorField = Object.keys(fieldLevelErrors)[0];
            if (firstErrorField) {
                const field = document.getElementById(firstErrorField);
                if (field) {
                    field.focus();
                }
            }
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

    function setCookie(name, value, maxAgeSeconds = 60 * 60) {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    }

    function getCookie(name) {
        const cookieValue = document.cookie
            .split("; ")
            .find((entry) => entry.startsWith(`${name}=`));

        return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : "";
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    }
});
