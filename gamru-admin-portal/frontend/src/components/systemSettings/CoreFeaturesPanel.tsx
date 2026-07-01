import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { toast } from 'react-toastify';
import type {
  SettingsRow,
  ModalKey,
  EnabledLanguagesForm,
  PaymentMethodForm,
  PaymentMethodErrors,
  ClientSiteForm,
  ClientSiteErrors,
  LanguageDTO,
  PaymentMethodDTO,
  AccountStatusDTO,
} from '../../types/systemSettings.types';
import type { AccountStatusForm, AccountStatusErrors } from '../../types/accountStatus';
import AvailableAccountStatusesModal from '../modals/settingsSystem/AvailableAccountStatusesModal';
import PaymentMethodsModal from '../modals/settingsSystem/PaymentMethodsModal';
import EnabledLanguagesModal from '../modals/settingsSystem/Enabledlanguagesmodal';
import ClientSiteModal from '../modals/settingsSystem/ClientSiteModal';
import {
  accountStatusesApi,
  paymentMethodsApi,
  languagesApi,
  settingsApi,
} from '@/services/systemSettings.service';

const CoreFeaturesPanel: FC = () => {
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [defaultLanguage, setDefaultLanguage] = useState<string>('—');

  // Account Status state
  const [accountStatusForm, setAccountStatusForm] = useState<AccountStatusForm>({ statuses: [] });
  const [accountStatusErrors] = useState<AccountStatusErrors>({});
  const [savingAccountStatus, setSavingAccountStatus] = useState(false);

  // Payment Methods state
  const [paymentMethodForm, setPaymentMethodForm] = useState<PaymentMethodForm>({ methods: [] });
  const [paymentMethodErrors] = useState<PaymentMethodErrors>({});
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);

  // Enabled Languages state
  const [enabledLanguagesForm, setEnabledLanguagesForm] = useState<EnabledLanguagesForm>({
    languages: [],
  });
  const [savingLanguages, setSavingLanguages] = useState(false);

  // Client Site state
  const [clientSiteForm, setClientSiteForm] = useState<ClientSiteForm>({ url: '' });
  const [clientSiteErrors] = useState<ClientSiteErrors>({});
  const [savingClientSite, setSavingClientSite] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [stat, pm, langs, core] = await Promise.all([
          accountStatusesApi.list(),
          paymentMethodsApi.list(),
          languagesApi.list(),
          settingsApi.getByPanel('core'),
        ]);

        setAccountStatusForm({
          statuses: (stat.data ?? []).map((s: AccountStatusDTO) => ({
            id: s.id,
            uniqueKey: s.unique_key,
            displayName: s.display_name,
            icon: s.icon ?? '',
            color: s.color ?? '',
          })),
        });

        setPaymentMethodForm({
          methods: (pm.data ?? []).map((m: PaymentMethodDTO) => ({
            id: m.id,
            uniqueKey: m.unique_key,
            displayName: m.display_name,
          })),
        });

        const langList = (langs.data ?? []) as LanguageDTO[];
        setEnabledLanguagesForm({
          languages: langList.map((l) => ({
            id: l.id,
            language: l.language,
            flag: l.flag ?? '',
            flagEmoji: l.flag_emoji ?? '',
          })),
        });

        const def = langList.find((l) => l.is_default);
        setDefaultLanguage(def?.language ?? (core.data?.default_language as string) ?? '—');

        setClientSiteForm({ url: (core.data?.client_site_url as string) ?? '' });
      } catch {
        toast.error('Failed to load core features settings');
      }
    })();
  }, []);

  const rows: SettingsRow[] = [
    {
      label: 'Account Status',
      description: 'Set up how account statuses are represented in the UI.',
      hasUpdate: true,
      modalKey: 'accountStatus',
    },
    {
      label: 'Payment Methods',
      description: 'Set up which payment methods are available to the player.',
      hasUpdate: true,
      modalKey: 'paymentMethods',
    },
    {
      label: 'Enabled Languages',
      description: 'These are the languages available for player translations.',
      hasUpdate: true,
      modalKey: 'enabledLanguages',
    },
    { label: 'Default Language', value: defaultLanguage },
    {
      label: 'Client Site',
      description: clientSiteForm.url || '—',
      hasUpdate: true,
      modalKey: 'clientSite',
    },
  ];

  const openModal = (key: ModalKey) => setActiveModal(key);
  const closeModal = () => setActiveModal(null);

  const handleAccountStatusSave = async () => {
    setSavingAccountStatus(true);
    try {
      await accountStatusesApi.replaceAll(
        accountStatusForm.statuses.map((s) => ({
          unique_key: s.uniqueKey,
          display_name: s.displayName,
          icon: s.icon || null,
          color: s.color || null,
        }))
      );
      toast.success('Account statuses saved');
      closeModal();
    } catch {
      toast.error('Failed to save account statuses');
    } finally {
      setSavingAccountStatus(false);
    }
  };

  const handlePaymentMethodSave = async () => {
    setSavingPaymentMethod(true);
    try {
      await paymentMethodsApi.replaceAll(
        paymentMethodForm.methods.map((m) => ({
          unique_key: m.uniqueKey,
          display_name: m.displayName,
        }))
      );
      toast.success('Payment methods saved');
      closeModal();
    } catch {
      toast.error('Failed to save payment methods');
    } finally {
      setSavingPaymentMethod(false);
    }
  };

  const handleLanguagesSave = async () => {
    setSavingLanguages(true);
    try {
      await languagesApi.replaceAll(
        enabledLanguagesForm.languages.map((l) => ({
          language: l.language,
          flag: l.flag || null,
          flag_emoji: l.flagEmoji || null,
          is_default: false,
        }))
      );
      toast.success('Languages saved');
      closeModal();
    } catch {
      toast.error('Failed to save languages');
    } finally {
      setSavingLanguages(false);
    }
  };

  const handleClientSiteSave = async () => {
    setSavingClientSite(true);
    try {
      await settingsApi.upsert('core', 'client_site_url', clientSiteForm.url);
      toast.success('Client site URL saved');
      closeModal();
    } catch {
      toast.error('Failed to save client site URL');
    } finally {
      setSavingClientSite(false);
    }
  };

  return (
    <div className="px-4">
      <h1 className="text-xl font-semibold text-slate-100 mb-6">Global</h1>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-5 py-4 hover:bg-slate-700/50 hover:border-slate-500 transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-200 text-sm">{row.label}</p>
              {row.description && (
                <p className="text-slate-500 text-xs mt-0.5">{row.description}</p>
              )}
            </div>

            {row.hasUpdate ? (
              <button
                onClick={() => openModal(row.modalKey ?? null)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
              >
                Update
              </button>
            ) : (
              <span className="text-slate-400 text-sm">{row.value}</span>
            )}
          </div>
        ))}
      </div>

      {activeModal === 'accountStatus' && (
        <AvailableAccountStatusesModal
          form={accountStatusForm}
          setForm={setAccountStatusForm}
          errors={accountStatusErrors}
          onSave={handleAccountStatusSave}
          loading={savingAccountStatus}
          closeModal={closeModal}
        />
      )}

      {activeModal === 'paymentMethods' && (
        <PaymentMethodsModal
          form={paymentMethodForm}
          setForm={setPaymentMethodForm}
          errors={paymentMethodErrors}
          onSave={handlePaymentMethodSave}
          loading={savingPaymentMethod}
          closeModal={closeModal}
        />
      )}

      {activeModal === 'enabledLanguages' && (
        <EnabledLanguagesModal
          form={enabledLanguagesForm}
          setForm={setEnabledLanguagesForm}
          onSave={handleLanguagesSave}
          loading={savingLanguages}
          closeModal={closeModal}
        />
      )}

      {activeModal === 'clientSite' && (
        <ClientSiteModal
          form={clientSiteForm}
          setForm={setClientSiteForm}
          errors={clientSiteErrors}
          onSave={handleClientSiteSave}
          loading={savingClientSite}
          closeModal={closeModal}
        />
      )}
    </div>
  );
};

export default CoreFeaturesPanel;
