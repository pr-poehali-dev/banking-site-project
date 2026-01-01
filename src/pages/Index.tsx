import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  username: string;
  email: string;
  balance: number;
  code: string;
  level: number;
  completedTasks: number;
  isBlocked: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  videoUrl?: string;
};

type Transaction = {
  id: string;
  type: 'send' | 'receive' | 'task' | 'admin';
  amount: number;
  from?: string;
  to?: string;
  timestamp: Date;
};

const Index = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    username: 'user123',
    email: 'user@example.com',
    balance: 1500,
    code: '12345678901234567890',
    level: 3,
    completedTasks: 12,
    isBlocked: false,
  });

  const [users, setUsers] = useState<User[]>([
    currentUser,
    {
      id: '2',
      username: 'crypto_pro',
      email: 'pro@example.com',
      balance: 3200,
      code: '98765432109876543210',
      level: 5,
      completedTasks: 28,
      isBlocked: false,
    },
    {
      id: '3',
      username: 'mega_trader',
      email: 'trader@example.com',
      balance: 890,
      code: '11223344556677889900',
      level: 2,
      completedTasks: 7,
      isBlocked: false,
    },
  ]);

  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Поделиться в социальных сетях',
      description: 'Опубликуйте пост о MegaCoin в своих социальных сетях',
      reward: 50,
      difficulty: 'easy',
    },
    {
      id: '2',
      title: 'Пригласить друга',
      description: 'Пригласите друга зарегистрироваться в системе',
      reward: 150,
      difficulty: 'medium',
    },
    {
      id: '3',
      title: 'Видео отзыв',
      description: 'Запишите видео отзыв о платформе MegaCoin',
      reward: 300,
      difficulty: 'hard',
      videoUrl: 'pending',
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'task',
      amount: 150,
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      type: 'send',
      amount: -100,
      to: 'crypto_pro',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      type: 'receive',
      amount: 200,
      from: 'mega_trader',
      timestamp: new Date(Date.now() - 86400000),
    },
  ]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    emailPassword: '',
    password: '',
    recipientCode: '',
    sendAmount: '',
    adminPassword: '',
    videoSubmission: '',
  });

  const validateUsername = (username: string): boolean => {
    const forbidden = ['admin', 'administrator', 'root', 'moderator'];
    const hasProfanity = /хуй|пизд|ебать|блять|сука/i.test(username);
    
    if (forbidden.some(word => username.toLowerCase().includes(word))) {
      toast({
        title: '❌ Ошибка',
        description: 'Это имя пользователя запрещено',
        variant: 'destructive',
      });
      return false;
    }
    
    if (hasProfanity) {
      toast({
        title: '❌ Ошибка',
        description: 'Имя содержит недопустимые слова',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const handleRegister = () => {
    if (!validateUsername(formData.username)) return;
    
    if (formData.password.length < 4) {
      toast({
        title: '❌ Ошибка',
        description: 'Пароль должен содержать минимум 4 символа',
        variant: 'destructive',
      });
      return;
    }

    const newCode = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('');
    const newUser: User = {
      id: String(users.length + 1),
      username: formData.username,
      email: formData.email,
      balance: 0,
      code: newCode,
      level: 1,
      completedTasks: 0,
      isBlocked: false,
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setShowAuth(false);
    
    toast({
      title: '🎉 Регистрация успешна!',
      description: `Ваш уникальный код: ${newCode}`,
    });
  };

  const handleLogin = () => {
    if (formData.username === 'admin' && formData.password === 'stepan12') {
      setIsAdmin(true);
      setIsLoggedIn(true);
      setShowAuth(false);
      toast({
        title: '👑 Вход в админ-панель',
        description: 'Добро пожаловать, администратор!',
      });
    } else {
      setIsLoggedIn(true);
      setShowAuth(false);
      toast({
        title: '✅ Вход выполнен',
        description: `Добро пожаловать, ${currentUser.username}!`,
      });
    }
  };

  const handleSendCoins = () => {
    const amount = parseInt(formData.sendAmount);
    const recipient = users.find(u => u.code === formData.recipientCode);

    if (!recipient) {
      toast({
        title: '❌ Ошибка',
        description: 'Получатель не найден',
        variant: 'destructive',
      });
      return;
    }

    if (amount > currentUser.balance) {
      toast({
        title: '❌ Недостаточно средств',
        description: 'На вашем счету недостаточно MegaCoin',
        variant: 'destructive',
      });
      return;
    }

    const commission = Math.floor(amount * 0.02);
    const total = amount + commission;

    setCurrentUser({ ...currentUser, balance: currentUser.balance - total });
    
    const newTransaction: Transaction = {
      id: String(transactions.length + 1),
      type: 'send',
      amount: -total,
      to: recipient.username,
      timestamp: new Date(),
    };
    
    setTransactions([newTransaction, ...transactions]);
    
    toast({
      title: '✅ Перевод выполнен',
      description: `Отправлено ${amount} MC (комиссия ${commission} MC)`,
    });
    
    setFormData({ ...formData, sendAmount: '', recipientCode: '' });
  };

  const handleCompleteTask = (task: Task) => {
    setCurrentUser({
      ...currentUser,
      balance: currentUser.balance + task.reward,
      completedTasks: currentUser.completedTasks + 1,
      level: Math.floor((currentUser.completedTasks + 1) / 5) + 1,
    });

    const newTransaction: Transaction = {
      id: String(transactions.length + 1),
      type: 'task',
      amount: task.reward,
      timestamp: new Date(),
    };
    
    setTransactions([newTransaction, ...transactions]);

    toast({
      title: '🎉 Задание выполнено!',
      description: `Вы получили ${task.reward} MegaCoin`,
    });
  };

  const handleResetAllBalances = () => {
    setUsers(users.map(u => ({ ...u, balance: 0 })));
    setCurrentUser({ ...currentUser, balance: 0 });
    toast({
      title: '🔄 Баланс сброшен',
      description: 'Балансы всех пользователей обнулены',
    });
  };

  const handleBlockUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
    toast({
      title: '🔒 Статус изменен',
      description: 'Статус пользователя обновлен',
    });
  };

  const handleAddCoins = (userId: string, amount: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, balance: u.balance + amount } : u));
    toast({
      title: '💰 Баланс пополнен',
      description: `Начислено ${amount} MegaCoin`,
    });
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
                  <h3 className="text-2xl font-bold">Переводы</h3>
                  <p className="text-muted-foreground">Мгновенные транзакции</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Отправляй монеты друзьям по уникальному коду
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

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="videos">Видео заданий</TabsTrigger>
              <TabsTrigger value="actions">Действия</TabsTrigger>
            </TabsList>

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
                          {user.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">Код: {user.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{user.balance} MC</p>
                      <p className="text-sm text-muted-foreground">Уровень {user.level}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlockUser(user.id)}
                        >
                          <Icon name={user.isBlocked ? "Unlock" : "Lock"} size={16} />
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

            <TabsContent value="videos">
              <Alert>
                <Icon name="Video" size={20} />
                <AlertDescription>
                  Здесь будут отображаться видео от пользователей, выполнивших задания
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-4">
                {tasks.filter(t => t.videoUrl).map((task) => (
                  <Card key={task.id} className="glass p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">Ожидает проверки</p>
                      </div>
                      <Button size="sm">Просмотреть видео</Button>
                    </div>
                  </Card>
                ))}
              </div>
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
              <p className="text-2xl font-bold text-primary">{currentUser.balance} MC</p>
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
            <p className="text-2xl font-bold mb-1">{currentUser.username}</p>
            <p className="text-sm text-muted-foreground mb-3">{currentUser.email}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-primary to-secondary">
                Уровень {currentUser.level}
              </Badge>
              <Badge variant="outline">{currentUser.completedTasks} заданий</Badge>
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Wallet" size={24} className="text-secondary" />
              <h3 className="font-bold text-lg">Ваш баланс</h3>
            </div>
            <p className="text-4xl font-bold gradient-text mb-2">{currentUser.balance}</p>
            <p className="text-sm text-muted-foreground">MegaCoin</p>
            <Progress value={(currentUser.balance / 5000) * 100} className="mt-3" />
          </Card>

          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Key" size={24} className="text-accent" />
              <h3 className="font-bold text-lg">Ваш код</h3>
            </div>
            <p className="text-lg font-mono font-bold break-all">{currentUser.code}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Используйте для получения переводов
            </p>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">
              <Icon name="ListTodo" size={18} className="mr-2" />
              Задания
            </TabsTrigger>
            <TabsTrigger value="send">
              <Icon name="Send" size={18} className="mr-2" />
              Перевод
            </TabsTrigger>
            <TabsTrigger value="history">
              <Icon name="History" size={18} className="mr-2" />
              История
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
                  onClick={() => handleCompleteTask(task)}
                >
                  <Icon name="Check" size={20} className="mr-2" />
                  Выполнить задание
                </Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="send">
            <Card className="glass p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-6">Отправить MegaCoin</h3>
              <div className="space-y-4">
                <div>
                  <Label>Код получателя (20 цифр)</Label>
                  <Input
                    placeholder="12345678901234567890"
                    maxLength={20}
                    value={formData.recipientCode}
                    onChange={(e) => setFormData({ ...formData, recipientCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Сумма перевода</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.sendAmount}
                    onChange={(e) => setFormData({ ...formData, sendAmount: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Комиссия: 2% от суммы перевода
                  </p>
                </div>
                <Alert>
                  <Icon name="Info" size={20} />
                  <AlertDescription>
                    {formData.sendAmount && parseInt(formData.sendAmount) > 0
                      ? `Итого к списанию: ${parseInt(formData.sendAmount) + Math.floor(parseInt(formData.sendAmount) * 0.02)} MC (включая комиссию ${Math.floor(parseInt(formData.sendAmount) * 0.02)} MC)`
                      : 'Введите сумму для расчета комиссии'}
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={handleSendCoins}
                  disabled={!formData.recipientCode || !formData.sendAmount}
                >
                  <Icon name="Send" size={20} className="mr-2" />
                  Отправить
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card key={tx.id} className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          tx.type === 'send'
                            ? 'bg-red-500/20'
                            : tx.type === 'receive'
                            ? 'bg-green-500/20'
                            : 'bg-blue-500/20'
                        }`}
                      >
                        <Icon
                          name={
                            tx.type === 'send'
                              ? 'ArrowUpRight'
                              : tx.type === 'receive'
                              ? 'ArrowDownLeft'
                              : 'Gift'
                          }
                          size={20}
                          className={
                            tx.type === 'send'
                              ? 'text-red-500'
                              : tx.type === 'receive'
                              ? 'text-green-500'
                              : 'text-blue-500'
                          }
                        />
                      </div>
                      <div>
                        <p className="font-bold">
                          {tx.type === 'send' && `Перевод для ${tx.to}`}
                          {tx.type === 'receive' && `Получено от ${tx.from}`}
                          {tx.type === 'task' && 'Награда за задание'}
                          {tx.type === 'admin' && 'Начисление администратором'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.timestamp.toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount} MC
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rating">
            <div className="space-y-3">
              {users
                .sort((a, b) => b.balance - a.balance)
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
                          {user.completedTasks} заданий выполнено
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{user.balance}</p>
                        <p className="text-sm text-muted-foreground">MegaCoin</p>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
