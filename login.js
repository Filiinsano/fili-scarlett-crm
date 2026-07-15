document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');

    // Base de datos simulada de clientes
    const mockUsers = {
        'dentista@demo.com': {
            password: '123',
            clientId: 'dentista',
            name: 'Dr. Ricardo Ruiz'
        },
        'pizzeria@demo.com': {
            password: '123',
            clientId: 'pizzeria',
            name: 'Pizzería Don Juan'
        },
        'admin@scarlett.ai': {
            password: '123',
            clientId: 'admin',
            name: 'Administrador General'
        }
    };

    // Si ya está logueado, redirigir al dashboard
    if (localStorage.getItem('currentClientId')) {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        
        // Estado de carga
        const originalBtnText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Conectando...';
        lucide.createIcons();
        loginBtn.disabled = true;
        errorMessage.classList.remove('show');

        // Simular retraso de red
        setTimeout(() => {
            const user = mockUsers[email];
            
            if (user && user.password === password) {
                // Login exitoso
                localStorage.setItem('currentClientId', user.clientId);
                localStorage.setItem('currentClientName', user.name);
                
                loginBtn.innerHTML = '<i data-lucide="check"></i> Acceso Permitido';
                lucide.createIcons();
                loginBtn.classList.replace('btn-primary', 'btn-secondary');
                loginBtn.style.background = '#10b981';
                loginBtn.style.borderColor = '#10b981';
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                // Login fallido
                loginBtn.innerHTML = originalBtnText;
                loginBtn.disabled = false;
                lucide.createIcons();
                errorMessage.classList.add('show');
                
                // Shake animation en el input
                passwordInput.style.animation = 'shake 0.4s';
                setTimeout(() => passwordInput.style.animation = '', 400);
            }
        }, 800);
    });
});

// Estilo para la animación de carga y error
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
