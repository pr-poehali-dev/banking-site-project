import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type Task = {
  id: number;
  title: string;
  reward: number;
};

type TaskSubmitDialogProps = {
  task: Task;
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess: () => void;
};

export const TaskSubmitDialog = ({ task, userId, open, onOpenChange, onSubmitSuccess }: TaskSubmitDialogProps) => {
  const { toast } = useToast();
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!screenshotUrl || !linkUrl) {
      toast({
        title: '❌ Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await api.tasks.submit({
        task_id: task.id,
        user_id: userId,
        screenshot_url: screenshotUrl,
        link_url: linkUrl,
      });

      if (result.submission) {
        toast({
          title: '✅ Задание отправлено!',
          description: 'Ожидайте проверки администратором',
        });
        onSubmitSuccess();
        onOpenChange(false);
        setScreenshotUrl('');
        setLinkUrl('');
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось отправить задание',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">
            Выполнить задание
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">{task.title}</h3>
            <Badge className="bg-gradient-to-r from-primary to-secondary">
              +{task.reward} MC
            </Badge>
          </div>
          <div>
            <Label>Ссылка на скриншот</Label>
            <Input
              type="url"
              placeholder="https://imgur.com/..."
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Загрузите скриншот на imgur.com или другой сервис
            </p>
          </div>
          <div>
            <Label>Ссылка на пост/результат</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Icon name="Send" size={20} className="mr-2" />
                Отправить на проверку
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskSubmitDialog;
