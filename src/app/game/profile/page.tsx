'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, SubmitHandler, useFieldArray } from 'react-hook-form';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Save, ChevronDown, Loader2, Plus } from 'lucide-react';
import { Guardian, User, CreateGuardianInput } from '@/types/user';

// Tipo para los datos del guardian en el formulario
export interface GuardianFormData {
  id: number; // ID temporal o real para tracking
  documentId: string; // documentId de Strapi (vacío para nuevos)
  name: string;
  lastName: string;
  DNI: string;
  email?: string;
  phone?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  country?: string;
}

// Tipo para el formulario completo incluyendo guardians
export interface ProfileFormData extends Partial<User> {
  guardians?: GuardianFormData[];
}

import { PersonalDataForm } from '@/components/profile/PersonalDataForm';
import { ContactDataForm } from '@/components/profile/ContactDataForm';
import { GuardiansList } from '@/components/profile/GuardiansList';
import { UserService, UpdateUserInput } from '@/services/user.service';
import { GuardianService } from '@/services/guardian.service';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Snapshot del servidor para comparar cambios al submit
  const [serverGuardiansSnapshot, setServerGuardiansSnapshot] = useState<Guardian[]>([]);

  const [guardiansOpen, setGuardiansOpen] = useState(true);

  // React Hook Form
  const form = useForm<ProfileFormData>({
    defaultValues: {
      username: '',
      email: '',
      name: '',
      lastname: '',
      phone: '',
      address: '',
      city: '',
      zipcode: '',
      country: '',
      age: '',
      guardians: [],
    },
  });

  // useFieldArray para manejar guardians dinámicamente
  const guardiansFieldArray = useFieldArray({
    control: form.control,
    name: 'guardians',
  });

  // Mapear Guardian del servidor a GuardianFormData
  const mapGuardianToFormData = useCallback((guardian: Guardian): GuardianFormData => ({
    id: guardian.id,
    documentId: guardian.documentId,
    name: guardian.name || '',
    lastName: guardian.lastName || '',
    DNI: guardian.DNI || '',
    email: guardian.email || '',
    phone: guardian.phone || '',
    address: guardian.address || '',
    zipcode: guardian.zipcode || '',
    city: guardian.city || '',
    country: guardian.country || '',
  }), []);

  const mapUserToFormData = useCallback(
    (userData: User): ProfileFormData => ({
      username: userData.username || '',
      email: userData.email || '',
      name: userData.name || '',
      lastname: userData.lastname || '',
      phone: userData.phone || '',
      address: userData.address || '',
      city: userData.city || '',
      zipcode: userData.zipcode || '',
      country: userData.country || '',
      age: userData.age || '',
      guardians: [],
    }),
    []
  );

  // Cargar datos del usuario y guardians
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await UserService.getMe();
        console.log('[DEBUG] User data received:', userData);
        updateUser(userData);
        const formData = mapUserToFormData(userData);
        form.reset(formData);

        if (userData.id) {
          const userGuardians = await GuardianService.listByUser(userData.id);
          console.log('[DEBUG] Guardians loaded:', userGuardians);
          setServerGuardiansSnapshot(userGuardians);
        }
        setIsEditing(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (user?.id) {
          try {
            const userDataById = await UserService.getById(user.id);
            updateUser(userDataById);
            const formData = mapUserToFormData(userDataById);
            form.reset(formData);
            const userGuardians = await GuardianService.listByUser(user.id);
            setServerGuardiansSnapshot(userGuardians);
          } catch (innerError) {
            console.error('Error fetching user data by ID:', innerError);
          }
        }
      }
    };

    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar formData con user (sin guardians, se manejan por separado)
  useEffect(() => {
    if (user) {
      const formData = mapUserToFormData(user);
      form.reset(formData);
    }
  }, [user, form, mapUserToFormData]);

  // Sincronizar guardians del servidor con useFieldArray
  useEffect(() => {
    if (serverGuardiansSnapshot.length > 0) {
      const guardiansFormData = serverGuardiansSnapshot.map(mapGuardianToFormData);
      console.log('[DEBUG] Syncing guardians to fieldArray:', guardiansFormData);
      console.log('[DEBUG] Current fields before sync:', guardiansFieldArray.fields.length);
      guardiansFieldArray.replace(guardiansFormData);
      console.log('[DEBUG] Fields after sync:', guardiansFieldArray.fields.length);
    } else if (serverGuardiansSnapshot.length === 0 && guardiansFieldArray.fields.length > 0) {
      // Si no hay guardians en el servidor pero hay en el form, limpiar
      console.log('[DEBUG] Clearing guardians from fieldArray');
      guardiansFieldArray.replace([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverGuardiansSnapshot]);

  // Calcular si es menor de edad
  const age = form.watch('age');
  useEffect(() => {
    if (age) {
      const birthDate = new Date(age);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setIsMinor(calculatedAge < 18);
      setGuardiansOpen(calculatedAge < 18);
    } else {
      setIsMinor(false);
      setGuardiansOpen(false);
    }
  }, [age]);



  const addGuardian = () => {
    if (!isEditing) return;
    
    // Validar máximo 2 padres
    const currentGuardians = form.getValues('guardians') || [];
    if (currentGuardians.length >= 2) {
      setMessage({ type: 'error', text: 'Solo se pueden agregar máximo 2 padres.' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    
    // Agregar guardian temporal usando useFieldArray
    const tempGuardian: GuardianFormData = {
      id: Date.now(), // ID temporal para la UI
      documentId: '', // Se asignará cuando se cree en Strapi
      name: '',
      lastName: '',
      DNI: '',
      email: '',
      phone: '',
      address: '',
      zipcode: '',
      city: '',
      country: '',
    };
    
    guardiansFieldArray.append(tempGuardian);
  };

  const removeGuardian = (index: number) => {
    if (!isEditing) return;
    const currentGuardians = form.getValues('guardians') || [];
    const guardian = currentGuardians[index];
    if (!guardian) return;

    // Remover usando useFieldArray
    guardiansFieldArray.remove(index);
  };

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setLoading(true);
    setMessage(null);

    try {
      if (!user?.id) throw new Error('User ID not found');

      // 1. Actualizar datos del usuario (sin guardians)
      const userPayload: UpdateUserInput = {
        username: data.username,
        email: data.email,
        name: data.name,
        lastname: data.lastname,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zipcode: data.zipcode,
        country: data.country,
      };

      // Handle Date field
      if (data.age) {
        userPayload.age = data.age;
      }

      // Sanitize empty strings
      Object.keys(userPayload).forEach((key) => {
        const typedKey = key as keyof UpdateUserInput;
        if (userPayload[typedKey] === '') {
          (userPayload as Record<string, unknown>)[typedKey] = null;
        }
      });

      // Actualizar usuario
      console.log('[DEBUG] Updating user data...');
      const updatedUser = await UserService.update(String(user.id), userPayload);
      updateUser(updatedUser);
      const formData = mapUserToFormData(updatedUser);
      form.reset(formData);

      // 2. Procesar cambios de guardians
      const formGuardians = data.guardians || [];
      
      // Calcular cambios comparando formGuardians con serverGuardiansSnapshot
      const toDelete: string[] = [];
      const toCreate: CreateGuardianInput[] = [];
      const toUpdate: { documentId: string; data: Partial<CreateGuardianInput> }[] = [];

      // Encontrar guardians eliminados (están en snapshot pero no en form)
      for (const serverGuardian of serverGuardiansSnapshot) {
        const existsInForm = formGuardians.some(fg => fg.documentId === serverGuardian.documentId && serverGuardian.documentId);
        if (!existsInForm) {
          toDelete.push(serverGuardian.documentId);
        }
      }

      // Procesar guardians del form
      for (const formGuardian of formGuardians) {
        if (!formGuardian.documentId) {
          // Es un guardian nuevo (sin documentId)
          if (formGuardian.name && formGuardian.lastName && formGuardian.DNI) {
            toCreate.push({
              name: formGuardian.name,
              lastName: formGuardian.lastName,
              DNI: formGuardian.DNI,
              email: formGuardian.email,
              phone: formGuardian.phone,
              address: formGuardian.address,
              zipcode: formGuardian.zipcode,
              city: formGuardian.city,
              country: formGuardian.country,
            });
          }
        } else {
          // Es un guardian existente, verificar si cambió
          const serverGuardian = serverGuardiansSnapshot.find(sg => sg.documentId === formGuardian.documentId);
          if (serverGuardian) {
            // Comparar campos para ver si hay cambios
            const hasChanges = 
              formGuardian.name !== serverGuardian.name ||
              formGuardian.lastName !== serverGuardian.lastName ||
              formGuardian.DNI !== serverGuardian.DNI ||
              formGuardian.email !== (serverGuardian.email || '') ||
              formGuardian.phone !== (serverGuardian.phone || '') ||
              formGuardian.address !== (serverGuardian.address || '') ||
              formGuardian.zipcode !== (serverGuardian.zipcode || '') ||
              formGuardian.city !== (serverGuardian.city || '') ||
              formGuardian.country !== (serverGuardian.country || '');

            if (hasChanges) {
              const updateData: Partial<CreateGuardianInput> = {};
              if (formGuardian.name !== serverGuardian.name) updateData.name = formGuardian.name;
              if (formGuardian.lastName !== serverGuardian.lastName) updateData.lastName = formGuardian.lastName;
              if (formGuardian.DNI !== serverGuardian.DNI) updateData.DNI = formGuardian.DNI;
              if (formGuardian.email !== (serverGuardian.email || '')) updateData.email = formGuardian.email || undefined;
              if (formGuardian.phone !== (serverGuardian.phone || '')) updateData.phone = formGuardian.phone || undefined;
              if (formGuardian.address !== (serverGuardian.address || '')) updateData.address = formGuardian.address || undefined;
              if (formGuardian.zipcode !== (serverGuardian.zipcode || '')) updateData.zipcode = formGuardian.zipcode || undefined;
              if (formGuardian.city !== (serverGuardian.city || '')) updateData.city = formGuardian.city || undefined;
              if (formGuardian.country !== (serverGuardian.country || '')) updateData.country = formGuardian.country || undefined;

              if (Object.keys(updateData).length > 0) {
                toUpdate.push({ documentId: formGuardian.documentId, data: updateData });
              }
            }
          }
        }
      }

      // 2.1 Eliminar guardians (primero para evitar conflictos)
      for (const documentId of toDelete) {
        console.log('[DEBUG] Deleting guardian...', documentId);
        try {
          await GuardianService.deleteByDocumentId(documentId);
        } catch (error) {
          console.error('[DEBUG] Error deleting guardian:', error);
          // Continuar con los demás guardians
        }
      }

      // 2.2 Crear nuevos guardians
      for (const guardianData of toCreate) {
        console.log('[DEBUG] Creating guardian...', guardianData);
        try {
          await GuardianService.create(user.id, guardianData);
        } catch (error) {
          console.error('[DEBUG] Error creating guardian:', error);
          // Continuar con los demás guardians
        }
      }

      // 2.3 Actualizar guardians existentes
      for (const { documentId, data } of toUpdate) {
        console.log('[DEBUG] Updating guardian...', documentId, data);
        try {
          await GuardianService.updateByDocumentId(documentId, data);
        } catch (error) {
          console.error('[DEBUG] Error updating guardian:', error);
          // Continuar con los demás guardians
        }
      }

      // 3. Recargar guardians desde el servidor
      const refreshedGuardians = await GuardianService.listByUser(user.id);
      setServerGuardiansSnapshot(refreshedGuardians);
      // Actualizar form con los guardians refrescados
      const guardiansFormData = refreshedGuardians.map(mapGuardianToFormData);
      guardiansFieldArray.replace(guardiansFormData);

      setIsEditing(false);

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err: unknown) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditing = () => {
    if (!user) return;
    const originalForm = mapUserToFormData(user);
    const currentFormData = form.getValues();
    const formChanged = Object.keys(originalForm).some(
      (key) => originalForm[key as keyof ProfileFormData] !== currentFormData[key as keyof ProfileFormData]
    );
    
    // Comparar guardians actuales con snapshot
    const currentGuardians = form.getValues('guardians') || [];
    const guardiansChanged = JSON.stringify(currentGuardians) !== JSON.stringify(serverGuardiansSnapshot.map(mapGuardianToFormData));
    
    if ((formChanged || guardiansChanged) && !window.confirm('¿Deseas descartar los cambios?')) {
      return;
    }
    setIsEditing(false);
    form.reset(originalForm);
    // Restaurar guardians desde snapshot
    const guardiansFormData = serverGuardiansSnapshot.map(mapGuardianToFormData);
    guardiansFieldArray.replace(guardiansFormData);
  };

  const handleAvatarUpdated = (updatedUser: User) => {
    updateUser(updatedUser);
    const formData = mapUserToFormData(updatedUser);
    form.reset(formData);
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-6 pb-12" onSubmit={form.handleSubmit(onSubmit)}>
      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-success/20 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-0">
        <ProfileTabs />
        <Card className="rounded-t-none rounded-b-lg border border-border/60 shadow-lg">
          <CardHeader className="space-y-0 p-0">
            <div className="flex flex-col gap-4 border-b border-border/50 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-2xl font-bold">Datos perfil</CardTitle>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEditing}
                      disabled={loading}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} size="sm" className="gap-2">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)} disabled={loading} size="sm">
                    Editar
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 border-b border-border/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <AvatarUpload
                user={user ?? null}
                disabled={!isEditing || loading}
                onAvatarUpdated={handleAvatarUpdated}
              />
              <ChangePasswordModal />
            </div>
          </CardHeader>

        <CardContent className="space-y-6 px-6 py-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border/30 p-3 sm:p-4">
              <PersonalDataForm disabled={!isEditing} />
            </div>
            <div className="rounded-lg border border-border/30 p-3 sm:p-4">
              <ContactDataForm disabled={!isEditing} />
            </div>
          </div>

          {isMinor && (
            <Collapsible open={guardiansOpen} onOpenChange={setGuardiansOpen} className="rounded-lg border border-border/30">
              <div className="flex flex-col gap-3 border-b border-border/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Responsables legales</p>
                  <h3 className="text-base font-medium sm:text-lg">Padres</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    onClick={addGuardian} 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 flex-1 sm:flex-initial" 
                    disabled={!isEditing}
                  >
                    <Plus className="h-4 w-4" /> Añadir
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="gap-2 flex-1 sm:flex-initial">
                      {guardiansOpen ? 'Ocultar' : 'Mostrar'}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          guardiansOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent className="px-3 py-3 sm:px-4 sm:py-4">
                <GuardiansList
                  isMinor={isMinor}
                  removeGuardian={removeGuardian}
                  disabled={!isEditing}
                  fields={guardiansFieldArray.fields}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
      </div>
    </form>
    </FormProvider>
  );
}
