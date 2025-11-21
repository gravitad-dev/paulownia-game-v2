'use client';

import { User } from '@/types/user';
import { User as UserIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { useFormContext, Controller } from 'react-hook-form';

export function PersonalDataForm({ disabled = false }: { disabled?: boolean }) {
  const { register, control } = useFormContext<User>();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Datos principales</p>
          <h3 className="text-lg font-medium">Información Personal</h3>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            {...register('username')}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...register('name')}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastname">Apellido</Label>
            <Input
              id="lastname"
              {...register('lastname')}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="age">Fecha de Nacimiento</Label>
          <Controller
            control={control}
            name="age"
            render={({ field }) => (
              <DatePicker
                id="age"
                name="age"
                value={field.value}
                onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                disabled={disabled}
                placeholder="Selecciona tu fecha de nacimiento"
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
