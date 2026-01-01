const API_BASE = {
  auth: 'https://functions.poehali.dev/1dd123e8-104c-4bd3-85c1-969e703268f7',
  tasks: 'https://functions.poehali.dev/6bac6955-74a1-4c0a-bf99-5201c1096c66',
  submissions: 'https://functions.poehali.dev/b6e7ebba-b85c-43ec-a6a7-a4d25dde66e0',
  users: 'https://functions.poehali.dev/4e01cb8d-34a9-4f04-9af3-d560e46b6579',
};

export const api = {
  auth: {
    register: async (data: { username: string; email: string; emailPassword: string; password: string }) => {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...data }),
      });
      return response.json();
    },
    login: async (data: { username: string; password: string }) => {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...data }),
      });
      return response.json();
    },
  },
  tasks: {
    list: async () => {
      const response = await fetch(`${API_BASE.tasks}?action=list`);
      return response.json();
    },
    adminList: async () => {
      const response = await fetch(`${API_BASE.tasks}?action=admin_list`);
      return response.json();
    },
    create: async (data: { title: string; description: string; reward: number; difficulty: string; created_by: number }) => {
      const response = await fetch(API_BASE.tasks, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...data }),
      });
      return response.json();
    },
    publish: async (task_id: number) => {
      const response = await fetch(API_BASE.tasks, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', task_id }),
      });
      return response.json();
    },
    submit: async (data: { task_id: number; user_id: number; screenshot_url: string; link_url: string }) => {
      const response = await fetch(API_BASE.tasks, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', ...data }),
      });
      return response.json();
    },
    approve: async (data: { submission_id: number; admin_id: number }) => {
      const response = await fetch(API_BASE.tasks, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ...data }),
      });
      return response.json();
    },
    reject: async (data: { submission_id: number; admin_id: number; comment: string }) => {
      const response = await fetch(API_BASE.tasks, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', ...data }),
      });
      return response.json();
    },
  },
  submissions: {
    list: async (status: string = 'pending') => {
      const response = await fetch(`${API_BASE.submissions}?status=${status}`);
      return response.json();
    },
  },
  users: {
    list: async () => {
      const response = await fetch(`${API_BASE.users}?action=list`);
      return response.json();
    },
    block: async (user_id: number, is_blocked: boolean) => {
      const response = await fetch(API_BASE.users, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', user_id, is_blocked }),
      });
      return response.json();
    },
    addBalance: async (user_id: number, amount: number, admin_id: number) => {
      const response = await fetch(API_BASE.users, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_balance', user_id, amount, admin_id }),
      });
      return response.json();
    },
    resetAll: async () => {
      const response = await fetch(API_BASE.users, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' }),
      });
      return response.json();
    },
  },
};
