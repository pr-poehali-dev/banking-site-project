import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type AdminCreateTaskDialogProps = {
  adminId: number;
  onTaskCreated: () => void;
};

export const AdminCreateTaskDialog = ({ adminId, onTaskCreated }: AdminCreateTaskDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [difficulty, setDifficulty] = useState('medium');

  const handleCreate = async () => {
    if (!title || !description || !reward) {
      toast({
        title: '❌ Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await api.tasks.create({
        title,
        description,
        reward: parseFloat(reward),
        difficulty,
        created_by: adminId,
      });

      if (result.task) {
        toast({
          title: '✅ Задание создано!',
          description: 'Теперь вы можете опубликовать его',
        });
        onTaskCreated();
        setOpen(false);
        setTitle('');
        setDescription('');
        setReward('');
        setDifficulty('medium');
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось создать задание',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Icon name="Plus" size={20} className="mr-2" />
          Создать задание
        </Button>
      </DialogTrigger>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">
            Новое задание
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Название задания</Label>
            <Input
              placeholder="Поделиться в соцсетях"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea
              placeholder="Опубликуйте пост о MegaCoin..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Награда (MC)</Label>
              <Input
                type="number"
                placeholder="100"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              />
            </div>
            <div>
              <Label>Сложность</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Легко</SelectItem>
                  <SelectItem value="medium">🟡 Средне</SelectItem>
                  <SelectItem value="hard">🔴 Сложно</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Icon name="Plus" size={20} className="mr-2" />
                Создать задание
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateTaskDialog;
