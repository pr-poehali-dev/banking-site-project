import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import TaskSubmitDialog from '@/components/TaskSubmitDialog';
import AdminCreateTaskDialog from '@/components/AdminCreateTaskDialog';

const Index = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    emailPassword: '',
    password: '',
  });

  const loadTasks = async () => {
    try {
      const result = isAdmin ? await api.tasks.adminList() : await api.tasks.list();
      if (result.tasks) {
        setTasks(result.tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await api.users.list();
      if (result.users) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const result = await api.submissions.list('pending');
      if (result.submissions) {
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadTasks();
      if (isAdmin) {
        loadUsers();
        loadSubmissions();
      }
    }
  }, [isLoggedIn, isAdmin]);

  const handleRegister = async () => {
    try {
      const result = await api.auth.register(formData);
      
      if (result.error) {
        toast({
          title: '❌ Ошибка',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result.user) {
        setCurrentUser(result.user);
        setIsLoggedIn(true);
        setShowAuth(false);
        toast({
          title: '🎉 Регистрация успешна!',
          description: `Ваш уникальный код: ${result.user.user_code}`,
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось зарегистрироваться',
        variant: 'destructive',
      });
    }
  };

  const handleLogin = async () => {
    try {
      const result = await api.auth.login({
        username: formData.username,
        password: formData.password,
      });
      
      if (result.error) {
        toast({
          title: '❌ Ошибка',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result.user) {
        setCurrentUser(result.user);
        setIsLoggedIn(true);
        setIsAdmin(result.isAdmin || false);
        setShowAuth(false);
        toast({
          title: result.isAdmin ? '👑 Вход в админ-панель' : '✅ Вход выполнен',
          description: `Добро пожаловать, ${result.user.username}!`,
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось войти',
        variant: 'destructive',
      });
    }
  };

  const handleApproveSubmission = async (submissionId: number) => {
    try {
      const result = await api.tasks.approve({
        submission_id: submissionId,
        admin_id: currentUser.id,
      });

      if (result.success) {
        toast({
          title: '✅ Задание одобрено',
          description: 'Пользователю начислены MegaCoin',
        });
        loadSubmissions();
        loadUsers();
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось одобрить задание',
        variant: 'destructive',
      });
    }
  };

  const handleRejectSubmission = async (submissionId: number) => {
    try {
      const result = await api.tasks.reject({
        submission_id: submissionId,
        admin_id: currentUser.id,
        comment: 'Не соответствует требованиям',
      });

      if (result.success) {
        toast({
          title: '❌ Задание отклонено',
          description: 'Пользователь уведомлён',
        });
        loadSubmissions();
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось отклонить задание',
        variant: 'destructive',
      });
    }
  };

  const handlePublishTask = async (taskId: number) => {
    try {
      const result = await api.tasks.publish(taskId);
      if (result.task) {
        toast({
          title: '✅ Задание опубликовано',
          description: 'Пользователи могут его выполнять',
        });
        loadTasks();
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось опубликовать задание',
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = async (userId: number, isBlocked: boolean) => {
    try {
      await api.users.block(userId, !isBlocked);
      toast({
        title: '🔒 Статус изменен',
        description: 'Статус пользователя обновлен',
      });
      loadUsers();
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось изменить статус',
        variant: 'destructive',
      });
    }
  };

  const handleAddCoins = async (userId: number, amount: number) => {
    try {
      await api.users.addBalance(userId, amount, currentUser.id);
      toast({
        title: '💰 Баланс пополнен',
        description: `Начислено ${amount} MegaCoin`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось начислить монеты',
        variant: 'destructive',
      });
    }
  };

  const handleResetAllBalances = async () => {
    try {
      await api.users.resetAll();
      toast({
        title: '🔄 Баланс сброшен',
        description: 'Балансы всех пользователей обнулены',
      });
      loadUsers();
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось сбросить балансы',
        variant: 'destructive',
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent blur-3xl opacity-50 animate-glow"></div>
                <Icon name="Coins" size={80} className="relative text-primary drop-shadow-2xl" />
              </div>
            </div>
            <h1 className="text-6xl font-bold gradient-text mb-4">MegaCoin Bank</h1>
            <p className="text-xl text-muted-foreground">
              Современная криптовалютная платформа будущего
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8 animate-slide-up">
            <Card className="glass p-8 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Icon name="TrendingUp" size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Заработок</h3>
                  <p className="text-muted-foreground">Выполняй задания</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Получай награды за выполнение заданий различной сложности
              </p>
            </Card>

            <Card className="glass p-8 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-secondary/20">
                  <Icon name="Send" size={32} className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Модерация</h3>
                  <p className="text-muted-foreground">Проверка заданий</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Отправь скриншот и ссылку для проверки администратором
              </p>
            </Card>

            <Card className="glass p-8 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Icon name="Trophy" size={32} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Рейтинг</h3>
                  <p className="text-muted-foreground">Соревнуйся с другими</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Поднимайся по уровням и занимай топовые позиции
              </p>
            </Card>

            <Card className="glass p-8 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Icon name="Shield" size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Безопасность</h3>
                  <p className="text-muted-foreground">Защита данных</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Надежное хранение и защита твоих активов
              </p>
            </Card>
          </div>

          <div className="flex justify-center gap-4 animate-fade-in">
            <Dialog open={showAuth} onOpenChange={setShowAuth}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8"
                  onClick={() => setAuthMode('register')}
                >
                  <Icon name="UserPlus" size={20} className="mr-2" />
                  Регистрация
                </Button>
              </DialogTrigger>
              <DialogContent className="glass max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl gradient-text">
                    {authMode === 'register' ? 'Создать аккаунт' : 'Вход в систему'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <Label>Имя пользователя</Label>
                        <Input
                          placeholder="Введите никнейм"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Пароль от почты</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={formData.emailPassword}
                          onChange={(e) => setFormData({ ...formData, emailPassword: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label>{authMode === 'register' ? 'Пароль для входа (от 4 символов)' : 'Пароль'}</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                    onClick={authMode === 'register' ? handleRegister : handleLogin}
                  >
                    {authMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                  >
                    {authMode === 'register' ? 'Уже есть аккаунт? Войти' : 'Создать новый аккаунт'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-primary/50 hover:bg-primary/10"
              onClick={() => {
                setShowAuth(true);
                setAuthMode('login');
              }}
            >
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-accent/50 hover:bg-accent/10"
              onClick={() => {
                setFormData({ username: 'admin', email: '', emailPassword: '', password: 'stepan12' });
                setShowAuth(true);
                setAuthMode('login');
              }}
            >
              <Icon name="Shield" size={20} className="mr-2" />
              Админ-панель
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">👑 Админ-панель</h1>
              <p className="text-muted-foreground">Управление платформой MegaCoin</p>
            </div>
            <Button variant="outline" onClick={() => { setIsAdmin(false); setIsLoggedIn(false); }}>
              <Icon name="LogOut" size={20} className="mr-2" />
              Выйти
            </Button>
          </div>

          <Tabs defaultValue="submissions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="submissions">Модерация</TabsTrigger>
              <TabsTrigger value="tasks">Задания</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="actions">Действия</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Ожидают проверки</h2>
                <Button variant="outline" onClick={loadSubmissions}>
                  <Icon name="RefreshCw" size={18} className="mr-2" />
                  Обновить
                </Button>
              </div>
              {submissions.length === 0 ? (
                <Alert>
                  <Icon name="CheckCircle" size={20} />
                  <AlertDescription>
                    Нет заданий на проверке
                  </AlertDescription>
                </Alert>
              ) : (
                submissions.map((sub) => (
                  <Card key={sub.id} className="glass p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{sub.task_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Пользователь: {sub.username} • Награда: {sub.reward} MC
                          </p>
                        </div>
                        <Badge className="bg-yellow-500">На проверке</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Скриншот</Label>
                          <a 
                            href={sub.screenshot_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Icon name="ExternalLink" size={14} />
                            Открыть
                          </a>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Ссылка</Label>
                          <a 
                            href={sub.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Icon name="ExternalLink" size={14} />
                            Открыть
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => handleApproveSubmission(sub.id)}
                        >
                          <Icon name="Check" size={18} className="mr-2" />
                          Одобрить
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleRejectSubmission(sub.id)}
                        >
                          <Icon name="X" size={18} className="mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Управление заданиями</h2>
                <AdminCreateTaskDialog 
                  adminId={currentUser.id} 
                  onTaskCreated={loadTasks}
                />
              </div>
              {tasks.map((task) => (
                <Card key={task.id} className="glass p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-gradient-to-r from-primary to-secondary">
                          {task.reward} MC
                        </Badge>
                        <Badge variant={task.difficulty === 'easy' ? 'default' : task.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                          {task.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.is_published ? (
                        <Badge className="bg-green-500">Опубликовано</Badge>
                      ) : (
                        <Button onClick={() => handlePublishTask(task.id)}>
                          <Icon name="Upload" size={18} className="mr-2" />
                          Опубликовать
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="glass p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20">
                        <Icon name="User" size={32} className="text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{user.username}</h3>
                          {user.is_blocked && <Badge variant="destructive">Заблокирован</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">Код: {user.user_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{parseFloat(user.balance).toFixed(2)} MC</p>
                      <p className="text-sm text-muted-foreground">Уровень {user.level}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlockUser(user.id, user.is_blocked)}
                        >
                          <Icon name={user.is_blocked ? "Unlock" : "Lock"} size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddCoins(user.id, 100)}
                        >
                          <Icon name="Plus" size={16} className="mr-1" />
                          100 MC
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="actions">
              <Card className="glass p-6">
                <h3 className="text-xl font-bold mb-4">Опасные действия</h3>
                <Alert className="mb-4">
                  <Icon name="AlertTriangle" size={20} />
                  <AlertDescription>
                    Эти действия необратимы. Используйте с осторожностью!
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  onClick={handleResetAllBalances}
                >
                  <Icon name="RefreshCw" size={20} className="mr-2" />
                  Обнулить все балансы
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Coins" size={32} className="text-primary" />
            <h1 className="text-2xl font-bold gradient-text">MegaCoin</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Баланс</p>
              <p className="text-2xl font-bold text-primary">
                {currentUser?.balance ? parseFloat(currentUser.balance).toFixed(2) : '0.00'} MC
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-6 mb-6 animate-fade-in">
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="User" size={24} className="text-primary" />
              <h3 className="font-bold text-lg">Профиль</h3>
            </div>
            <p className="text-2xl font-bold mb-1">{currentUser?.username}</p>
            <p className="text-sm text-muted-foreground mb-3">{currentUser?.email}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-primary to-secondary">
                Уровень {currentUser?.level || 1}
              </Badge>
              <Badge variant="outline">{currentUser?.completed_tasks || 0} заданий</Badge>
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Wallet" size={24} className="text-secondary" />
              <h3 className="font-bold text-lg">Ваш баланс</h3>
            </div>
            <p className="text-4xl font-bold gradient-text mb-2">
              {currentUser?.balance ? parseFloat(currentUser.balance).toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-muted-foreground">MegaCoin</p>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Key" size={24} className="text-accent" />
              <h3 className="font-bold text-lg">Ваш код</h3>
            </div>
            <p className="text-lg font-mono font-bold break-all">{currentUser?.user_code}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Используйте для получения переводов
            </p>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">
              <Icon name="ListTodo" size={18} className="mr-2" />
              Задания
            </TabsTrigger>
            <TabsTrigger value="rating">
              <Icon name="Trophy" size={18} className="mr-2" />
              Рейтинг
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="glass p-6 hover:scale-[1.02] transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{task.title}</h3>
                      <Badge
                        className={
                          task.difficulty === 'easy'
                            ? 'bg-green-500'
                            : task.difficulty === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }
                      >
                        {task.difficulty === 'easy' && '🟢 Легко'}
                        {task.difficulty === 'medium' && '🟡 Средне'}
                        {task.difficulty === 'hard' && '🔴 Сложно'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">+{task.reward}</p>
                    <p className="text-sm text-muted-foreground">MC</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={() => {
                    setSelectedTask(task);
                    setShowSubmitDialog(true);
                  }}
                >
                  <Icon name="Send" size={20} className="mr-2" />
                  Выполнить задание
                </Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rating">
            <div className="space-y-3">
              {users
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
                .map((user, index) => (
                  <Card key={user.id} className="glass p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-muted-foreground w-12">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                      <div className="p-3 rounded-xl bg-primary/20">
                        <Icon name="User" size={32} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{user.username}</h3>
                          <Badge>Уровень {user.level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.completed_tasks} заданий выполнено
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {parseFloat(user.balance).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">MegaCoin</p>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedTask && (
        <TaskSubmitDialog
          task={selectedTask}
          userId={currentUser.id}
          open={showSubmitDialog}
          onOpenChange={setShowSubmitDialog}
          onSubmitSuccess={loadTasks}
        />
      )}
    </div>
  );
};

export default Index;
