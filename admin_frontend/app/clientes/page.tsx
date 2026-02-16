"use client";

import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { adminBackendUrl } from "@/config/api";

interface ClientSummary {
  id: string;
  name: string;
  email: string;
  login: string;
  avatar: string;
  phone: string;
  address: string;
  active: boolean;
  addressesCount: number;
  phonesCount: number;
  created?: string;
  updated?: string;
}

interface ClientAddress {
  id?: string;
  clientId?: string;
  label: string;
  country: string;
  zipCode: string;
  streetType: string;
  streetName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  latitude?: number;
  longitude?: number;
  position: number;
  active: boolean;
  created?: string;
  updated?: string;
}

interface ClientPhone {
  id?: string;
  clientId?: string;
  label: string;
  phoneNumber: string;
  isWhatsapp: boolean;
  position: number;
  active: boolean;
  created?: string;
  updated?: string;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  login: string;
  avatar: string;
  active: boolean;
  created?: string;
  updated?: string;
  addresses: ClientAddress[];
  phones: ClientPhone[];
}

interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  login: string;
  password: string;
  avatar: string;
  active: boolean;
  addresses: ClientAddress[];
  phones: ClientPhone[];
}

interface CepResponse {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

interface ApiError {
  error?: string;
}

function createEmptyAddress(position: number): ClientAddress {
  return {
    label: "Comercial",
    country: "Brasil",
    zipCode: "",
    streetType: "",
    streetName: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
    position,
    active: true,
  };
}

function createEmptyPhone(position: number): ClientPhone {
  return {
    label: "Principal",
    phoneNumber: "",
    isWhatsapp: false,
    position,
    active: true,
  };
}

function createEmptyForm(): ClientFormData {
  return {
    name: "",
    email: "",
    login: "",
    password: "",
    avatar: "",
    active: true,
    addresses: [],
    phones: [],
  };
}

export default function ClientesPage() {
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingClient, setViewingClient] = useState<ClientDetail | null>(null);
  const [editingForm, setEditingForm] = useState<ClientFormData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ClientFormData>(createEmptyForm());
  const [pendingDeactivateClient, setPendingDeactivateClient] =
    useState<ClientSummary | null>(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [createAvatarError, setCreateAvatarError] = useState<string | null>(null);
  const [editAvatarError, setEditAvatarError] = useState<string | null>(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<ClientAddress>(createEmptyAddress(0));
  const [addressModalError, setAddressModalError] = useState<string | null>(null);
  const [isLookingUpAddressCep, setIsLookingUpAddressCep] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneForm, setPhoneForm] = useState<ClientPhone>(createEmptyPhone(0));
  const [phoneModalError, setPhoneModalError] = useState<string | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [editingPhoneIndex, setEditingPhoneIndex] = useState<number | null>(null);

  const totalClients = useMemo(() => clients.length, [clients.length]);

  useEffect(() => {
    void loadClients();
  }, []);

  const loadClients = async () => {
    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${adminBackendUrl}/clients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ClientSummary[] | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível carregar os clientes."));
        setIsLoading(false);
        return;
      }

      setClients(Array.isArray(payload) ? payload : []);
      setError(null);
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDetail = async (clientID: string): Promise<ClientDetail | null> => {
    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return null;
    }

    try {
      const response = await fetch(`${adminBackendUrl}/clients/${clientID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as ClientDetail | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível carregar o cliente."));
        return null;
      }

      if (Array.isArray(payload) || !("id" in payload)) {
        setError("Resposta inválida da API.");
        return null;
      }

      return normalizeClientDetail(payload);
    } catch {
      setError("Falha de conexão com a API.");
      return null;
    }
  };

  const handleClientMenuAction = async (
    client: ClientSummary,
    action: string | number,
  ) => {
    const selectedAction = String(action);

    if (selectedAction === "view") {
      setIsLoadingDetails(true);
      const detail = await fetchClientDetail(client.id);
      setIsLoadingDetails(false);
      if (detail) {
        setViewingClient(detail);
      }
      return;
    }

    if (selectedAction === "edit") {
      setIsLoadingDetails(true);
      const detail = await fetchClientDetail(client.id);
      setIsLoadingDetails(false);
      if (!detail) {
        return;
      }

      setEditingForm(toClientForm(detail));
      setEditFormError(null);
      setEditAvatarError(null);
      return;
    }

    if (selectedAction !== "toggle") {
      return;
    }

    if (client.active) {
      setPendingDeactivateClient(client);
      return;
    }

    await activateClient(client);
  };

  const activateClient = async (client: ClientSummary) => {
    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`${adminBackendUrl}/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          login: client.login,
          avatar: client.avatar || "",
          active: true,
        }),
      });

      const payload = (await response.json()) as ClientDetail | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível ativar o cliente."));
        return;
      }

      await loadClients();
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmDeactivateClient = async () => {
    if (!pendingDeactivateClient) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(
        `${adminBackendUrl}/clients/${pendingDeactivateClient.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response.json()) as ClientDetail | ApiError;
      if (!response.ok) {
        setError(getApiErrorMessage(payload, "Não foi possível desativar o cliente."));
        return;
      }

      await loadClients();
      setPendingDeactivateClient(null);
    } catch {
      setError("Falha de conexão com a API.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm(createEmptyForm());
    setCreateFormError(null);
    setCreateAvatarError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = readTokenFromCookie();
    if (!token) {
      setCreateFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    const payload = buildClientPayload(createForm, true);
    if (typeof payload === "string") {
      setCreateFormError(payload);
      return;
    }

    setIsSubmittingCreate(true);
    setCreateFormError(null);

    try {
      const response = await fetch(`${adminBackendUrl}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const apiPayload = (await response.json()) as ClientDetail | ApiError;
      if (!response.ok) {
        setCreateFormError(
          getApiErrorMessage(apiPayload, "Não foi possível cadastrar o cliente."),
        );
        setIsSubmittingCreate(false);
        return;
      }

      setIsCreateModalOpen(false);
      setCreateForm(createEmptyForm());
      setCreateAvatarError(null);
      await loadClients();
    } catch {
      setCreateFormError("Falha de conexão com a API.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const updateClientFromForm = async (form: ClientFormData): Promise<ClientDetail | null> => {
    if (!form.id) {
      return null;
    }

    const token = readTokenFromCookie();
    if (!token) {
      return null;
    }

    const payload = buildClientPayload(form, false);
    if (typeof payload === "string") {
      return null;
    }

    const response = await fetch(`${adminBackendUrl}/clients/${form.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const apiPayload = (await response.json()) as ClientDetail | ApiError;
    if (!response.ok || Array.isArray(apiPayload) || !("id" in apiPayload)) {
      return null;
    }

    return normalizeClientDetail(apiPayload);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingForm?.id) {
      return;
    }

    const token = readTokenFromCookie();
    if (!token) {
      setEditFormError("Sessão inválida. Faça login novamente.");
      return;
    }

    const payload = buildClientPayload(editingForm, false);
    if (typeof payload === "string") {
      setEditFormError(payload);
      return;
    }

    setIsSubmittingEdit(true);
    setEditFormError(null);

    try {
      const response = await fetch(`${adminBackendUrl}/clients/${editingForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const apiPayload = (await response.json()) as ClientDetail | ApiError;
      if (!response.ok) {
        setEditFormError(
          getApiErrorMessage(apiPayload, "Não foi possível atualizar o cliente."),
        );
        setIsSubmittingEdit(false);
        return;
      }

      setEditingForm(null);
      setEditAvatarError(null);
      await loadClients();
    } catch {
      setEditFormError("Falha de conexão com a API.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleAvatarChange = (
    event: ChangeEvent<HTMLInputElement>,
    mode: "create" | "edit",
  ) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      if (mode === "create") {
        setCreateAvatarError("Selecione um arquivo de imagem válido.");
      } else {
        setEditAvatarError("Selecione um arquivo de imagem válido.");
      }
      input.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      if (mode === "create") {
        setCreateAvatarError("A imagem deve ter no máximo 1MB.");
      } else {
        setEditAvatarError("A imagem deve ter no máximo 1MB.");
      }
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (mode === "create") {
        setCreateForm((currentForm) => ({ ...currentForm, avatar: dataUrl }));
        setCreateAvatarError(null);
      } else {
        setEditingForm((currentForm) =>
          currentForm ? { ...currentForm, avatar: dataUrl } : currentForm,
        );
        setEditAvatarError(null);
      }
      input.value = "";
    };
    reader.onerror = () => {
      if (mode === "create") {
        setCreateAvatarError("Não foi possível carregar a imagem.");
      } else {
        setEditAvatarError("Não foi possível carregar a imagem.");
      }
      input.value = "";
    };

    reader.readAsDataURL(file);
  };

  const openAddressModal = (addressIndex?: number) => {
    if (!editingForm?.id) {
      setEditFormError("Cadastre o cliente primeiro para adicionar endereços.");
      return;
    }

    if (typeof addressIndex === "number") {
      const currentAddress = editingForm.addresses[addressIndex];
      if (!currentAddress) {
        return;
      }
      setAddressForm({ ...currentAddress });
      setEditingAddressIndex(addressIndex);
    } else {
      setAddressForm(createEmptyAddress(editingForm.addresses.length));
      setEditingAddressIndex(null);
    }

    setAddressModalError(null);
    setIsAddressModalOpen(true);
  };

  const openPhoneModal = (phoneIndex?: number) => {
    if (!editingForm?.id) {
      setEditFormError("Cadastre o cliente primeiro para adicionar telefones.");
      return;
    }

    if (typeof phoneIndex === "number") {
      const currentPhone = editingForm.phones[phoneIndex];
      if (!currentPhone) {
        return;
      }
      setPhoneForm({ ...currentPhone });
      setEditingPhoneIndex(phoneIndex);
    } else {
      setPhoneForm(createEmptyPhone(editingForm.phones.length));
      setEditingPhoneIndex(null);
    }

    setPhoneModalError(null);
    setIsPhoneModalOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!editingForm?.id) {
      return;
    }

    const normalizedStreetType = normalizeStreetType(addressForm.streetType);
    const normalizedStreetName = (
      addressForm.streetName || addressForm.street
    ).trim();
    const normalizedStreet = composeStreet(normalizedStreetType, normalizedStreetName);

    const normalizedAddress: ClientAddress = {
      ...addressForm,
      label: addressForm.label.trim(),
      country: addressForm.country.trim() || "Brasil",
      zipCode: normalizeZipCode(addressForm.zipCode),
      streetType: normalizedStreetType,
      streetName: normalizedStreetName,
      street: normalizedStreet,
      number: addressForm.number.trim(),
      neighborhood: addressForm.neighborhood.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim().toUpperCase().slice(0, 2),
      complement: addressForm.complement.trim(),
      active: Boolean(addressForm.active),
      position:
        editingAddressIndex !== null
          ? editingAddressIndex
          : editingForm.addresses.length,
    };

    if (
      !normalizedAddress.zipCode &&
      !normalizedAddress.street &&
      !normalizedAddress.number &&
      !normalizedAddress.neighborhood &&
      !normalizedAddress.city &&
      !normalizedAddress.state &&
      !normalizedAddress.complement
    ) {
      setAddressModalError("Informe ao menos um dado de endereço.");
      return;
    }

    if (!normalizedAddress.country) {
      setAddressModalError("Informe o país do endereço.");
      return;
    }

    if (
      normalizedAddress.zipCode &&
      normalizeZipCode(normalizedAddress.zipCode).length !== 8
    ) {
      setAddressModalError("Informe um CEP válido com 8 dígitos.");
      return;
    }

    const nextAddresses = [...editingForm.addresses];
    if (editingAddressIndex !== null && nextAddresses[editingAddressIndex]) {
      nextAddresses[editingAddressIndex] = normalizedAddress;
    } else {
      nextAddresses.push(normalizedAddress);
    }

    const nextForm: ClientFormData = {
      ...editingForm,
      addresses: normalizeAddressPositions(nextAddresses),
    };

    setEditingForm(nextForm);
    setAddressModalError(null);
    setIsSavingAddress(true);

    try {
      const updatedClient = await updateClientFromForm(nextForm);
      if (!updatedClient) {
        setAddressModalError(
          "Não foi possível salvar o endereço agora. Verifique permissões e tente novamente.",
        );
        return;
      }

      setEditingForm(toClientForm(updatedClient));
      setIsAddressModalOpen(false);
      setEditingAddressIndex(null);
      await loadClients();
    } catch {
      setAddressModalError("Falha de conexão ao salvar endereço.");
    } finally {
      setIsSavingAddress(false);
    }

  };

  const handleSavePhone = async () => {
    if (!editingForm?.id) {
      return;
    }

    const normalizedPhone: ClientPhone = {
      ...phoneForm,
      label: phoneForm.label.trim(),
      phoneNumber: phoneForm.phoneNumber.trim(),
      isWhatsapp: Boolean(phoneForm.isWhatsapp),
      active: Boolean(phoneForm.active),
      position:
        editingPhoneIndex !== null ? editingPhoneIndex : editingForm.phones.length,
    };

    if (!normalizedPhone.phoneNumber) {
      setPhoneModalError("Informe o número de telefone.");
      return;
    }

    const nextPhones = [...editingForm.phones];
    if (editingPhoneIndex !== null && nextPhones[editingPhoneIndex]) {
      nextPhones[editingPhoneIndex] = normalizedPhone;
    } else {
      nextPhones.push(normalizedPhone);
    }

    const nextForm: ClientFormData = {
      ...editingForm,
      phones: normalizePhonePositions(nextPhones),
    };

    setEditingForm(nextForm);
    setPhoneModalError(null);
    setIsSavingPhone(true);

    try {
      const updatedClient = await updateClientFromForm(nextForm);
      if (!updatedClient) {
        setPhoneModalError(
          "Não foi possível salvar o telefone agora. Verifique permissões e tente novamente.",
        );
        return;
      }

      setEditingForm(toClientForm(updatedClient));
      setIsPhoneModalOpen(false);
      setEditingPhoneIndex(null);
      await loadClients();
    } catch {
      setPhoneModalError("Falha de conexão ao salvar telefone.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleLookupAddressZipCode = async () => {
    const token = readTokenFromCookie();
    if (!token) {
      setAddressModalError("Sessão inválida. Faça login novamente.");
      return;
    }

    const zipCode = normalizeZipCode(addressForm.zipCode);
    if (zipCode.length !== 8) {
      setAddressModalError("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setAddressModalError(null);
    setIsLookingUpAddressCep(true);

    try {
      const response = await fetch(`${adminBackendUrl}/utils/cep/${zipCode}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as CepResponse | ApiError;
      if (!response.ok) {
        setAddressModalError(
          getApiErrorMessage(payload, "Não foi possível buscar o CEP."),
        );
        return;
      }

      if (Array.isArray(payload) || !("zipCode" in payload)) {
        setAddressModalError("Resposta inválida do serviço de CEP.");
        return;
      }

      const streetParts = splitStreet(payload.street || "");
      setAddressForm((currentAddress) => ({
        ...currentAddress,
        zipCode: payload.zipCode || zipCode,
        country: currentAddress.country || "Brasil",
        streetType: streetParts.streetType || currentAddress.streetType,
        streetName:
          streetParts.streetName ||
          currentAddress.streetName ||
          currentAddress.street,
        street:
          composeStreet(
            streetParts.streetType || currentAddress.streetType,
            streetParts.streetName ||
              currentAddress.streetName ||
              currentAddress.street,
          ) || payload.street || currentAddress.street,
        neighborhood: payload.neighborhood || currentAddress.neighborhood,
        city: payload.city || currentAddress.city,
        state: payload.state || currentAddress.state,
        complement: payload.complement || currentAddress.complement,
      }));
    } catch {
      setAddressModalError("Falha de conexão ao buscar CEP.");
    } finally {
      setIsLookingUpAddressCep(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              <MaterialSymbol name="groups" className="text-[16px]" />
              Clientes
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              Gestão de Clientes
            </h1>
            <p className="mt-2 text-sm text-foreground/80">
              Cadastre e gerencie clientes, credenciais de acesso, endereços,
              telefones e avatar.
            </p>
            <p className="mt-3 text-sm font-medium text-foreground/80">
              Total de clientes: {totalClients}
            </p>
          </div>

          <Button
            color="primary"
            startContent={<MaterialSymbol name="person_add" className="text-[18px]" />}
            onPress={openCreateModal}
          >
            Novo cliente
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1/70 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-content1/70">
              <tr className="border-b border-default-200">
                <th className="px-4 py-3 font-semibold text-foreground/80">Avatar</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Nome</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Login</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Email</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Telefone</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Endereço</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Status</th>
                <th className="px-4 py-3 font-semibold text-foreground/80">Criado em</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground/80">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={9}>
                    Carregando clientes...
                  </td>
                </tr>
              ) : null}

              {!isLoading && error ? (
                <tr>
                  <td className="px-4 py-6 text-danger" colSpan={9}>
                    {error}
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error && clients.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-foreground/70" colSpan={9}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : null}

              {!isLoading && !error
                ? clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-default-200/70 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-sm font-semibold text-black dark:text-white">
                          {client.avatar ? (
                            <img
                              src={client.avatar}
                              alt={`Avatar de ${client.name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getClientInitial(client.name, client.login)
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{client.name || "-"}</td>
                      <td className="px-4 py-3 text-foreground/90">{client.login || "-"}</td>
                      <td className="px-4 py-3 text-foreground/90">{client.email || "-"}</td>
                      <td className="px-4 py-3 text-foreground/80">
                        {client.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        <div className="max-w-[260px]">
                          <p className="truncate">{client.address || "-"}</p>
                          <p className="text-xs text-foreground/60">
                            {client.addressesCount} endereços | {client.phonesCount} fones
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            client.active
                              ? "rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                              : "rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                          }
                        >
                          {client.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {formatDateTime(client.created)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={`Abrir ações de ${client.name}`}
                              isDisabled={isLoadingDetails}
                            >
                              <MaterialSymbol name="more_vert" className="text-[20px]" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label={`Ações do cliente ${client.name}`}
                            onAction={(key) => {
                              void handleClientMenuAction(client, key);
                            }}
                          >
                            <DropdownItem
                              key="view"
                              startContent={
                                <MaterialSymbol
                                  name="visibility"
                                  className="text-[18px]"
                                />
                              }
                            >
                              Visualizar
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={
                                <MaterialSymbol name="edit" className="text-[18px]" />
                              }
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="toggle"
                              className={client.active ? "text-warning" : "text-success"}
                              color={client.active ? "warning" : "success"}
                              startContent={
                                <MaterialSymbol
                                  name={client.active ? "toggle_off" : "toggle_on"}
                                  className="text-[18px]"
                                />
                              }
                            >
                              {client.active ? "Desativar" : "Ativar"}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onOpenChange={(isOpen) => {
          setIsCreateModalOpen(isOpen);
          if (!isOpen) {
            setCreateForm(createEmptyForm());
            setCreateFormError(null);
            setCreateAvatarError(null);
          }
        }}
        placement="center"
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeModal) => (
            <form onSubmit={handleCreateSubmit}>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name="person_add"
                    className="text-[20px] text-primary"
                  />
                  Novo cliente
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <ClientFormFields
                  form={createForm}
                  avatarInputRef={createAvatarInputRef}
                  avatarError={createAvatarError}
                  onFieldChange={(field, value) =>
                    setCreateForm((currentForm) => ({
                      ...currentForm,
                      [field]: value,
                    }))
                  }
                  onAvatarFileChange={(event) => handleAvatarChange(event, "create")}
                  onClearAvatar={() => {
                    setCreateForm((currentForm) => ({ ...currentForm, avatar: "" }));
                    setCreateAvatarError(null);
                  }}
                  isCreateMode
                />

                <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warning">
                    Endereços e telefones
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    Cadastre o cliente primeiro. Após salvar, abra a edição do cliente
                    para adicionar endereços e telefones em modais separados.
                  </p>
                </div>

                {createFormError ? (
                  <p className="text-sm font-medium text-danger">{createFormError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setIsCreateModalOpen(false);
                    setCreateForm(createEmptyForm());
                    setCreateFormError(null);
                    setCreateAvatarError(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSubmittingCreate}
                  startContent={
                    isSubmittingCreate ? null : (
                      <MaterialSymbol name="save" className="text-[18px]" />
                    )
                  }
                >
                  Salvar cliente
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(editingForm)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingForm(null);
            setEditFormError(null);
            setEditAvatarError(null);
            setIsAddressModalOpen(false);
            setIsPhoneModalOpen(false);
            setAddressModalError(null);
            setPhoneModalError(null);
          }
        }}
        placement="center"
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent className="max-h-[92vh]">
          {(closeModal) => (
            <form onSubmit={handleEditSubmit}>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="edit" className="text-[20px] text-primary" />
                  Editar cliente
                </span>
              </ModalHeader>
              <ModalBody className="max-h-[70vh] gap-4 overflow-y-auto">
                {editingForm ? (
                  <ClientFormFields
                    form={editingForm}
                    avatarInputRef={editAvatarInputRef}
                    avatarError={editAvatarError}
                    onFieldChange={(field, value) =>
                      setEditingForm((currentForm) =>
                        currentForm
                          ? {
                              ...currentForm,
                              [field]: value,
                            }
                          : currentForm,
                      )
                    }
                    onAvatarFileChange={(event) => handleAvatarChange(event, "edit")}
                    onClearAvatar={() => {
                      setEditingForm((currentForm) =>
                        currentForm ? { ...currentForm, avatar: "" } : currentForm,
                      );
                      setEditAvatarError(null);
                    }}
                    isCreateMode={false}
                  />
                ) : null}

                {editingForm ? (
                  <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                        <MaterialSymbol name="location_on" className="text-[16px]" />
                        Endereços
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="flat"
                        startContent={<MaterialSymbol name="add" className="text-[16px]" />}
                        onPress={() => openAddressModal()}
                      >
                        Adicionar endereço
                      </Button>
                    </div>

                    {editingForm.addresses.length === 0 ? (
                      <p className="mt-2 text-sm text-foreground/70">
                        Nenhum endereço cadastrado.
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {editingForm.addresses.map((address, index) => (
                          <div
                            key={address.id || `${address.street}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default-200 bg-content1/70 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {address.label || `Endereço ${index + 1}`}
                              </p>
                              <p className="text-xs text-foreground/70">
                                {formatAddressText(address)} | CEP:{" "}
                                {formatZipCode(address.zipCode)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="light"
                                startContent={
                                  <MaterialSymbol name="edit" className="text-[16px]" />
                                }
                                onPress={() => openAddressModal(index)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() =>
                                  setEditingForm((currentForm) => {
                                    if (!currentForm) {
                                      return currentForm;
                                    }
                                    return {
                                      ...currentForm,
                                      addresses: normalizeAddressPositions(
                                        currentForm.addresses.filter(
                                          (_item, currentIndex) =>
                                            currentIndex !== index,
                                        ),
                                      ),
                                    };
                                  })
                                }
                              >
                                <MaterialSymbol name="delete" className="text-[18px]" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {editingForm ? (
                  <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                        <MaterialSymbol name="phone" className="text-[16px]" />
                        Telefones
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="flat"
                        startContent={<MaterialSymbol name="add" className="text-[16px]" />}
                        onPress={() => openPhoneModal()}
                      >
                        Adicionar telefone
                      </Button>
                    </div>

                    {editingForm.phones.length === 0 ? (
                      <p className="mt-2 text-sm text-foreground/70">
                        Nenhum telefone cadastrado.
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {editingForm.phones.map((phone, index) => (
                          <div
                            key={phone.id || `${phone.phoneNumber}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default-200 bg-content1/70 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {phone.label || `Telefone ${index + 1}`}
                              </p>
                              <p className="text-xs text-foreground/70">
                                {phone.phoneNumber || "-"} |{" "}
                                {phone.isWhatsapp ? "WhatsApp" : "Telefone"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="light"
                                startContent={
                                  <MaterialSymbol name="edit" className="text-[16px]" />
                                }
                                onPress={() => openPhoneModal(index)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() =>
                                  setEditingForm((currentForm) => {
                                    if (!currentForm) {
                                      return currentForm;
                                    }
                                    return {
                                      ...currentForm,
                                      phones: normalizePhonePositions(
                                        currentForm.phones.filter(
                                          (_item, currentIndex) =>
                                            currentIndex !== index,
                                        ),
                                      ),
                                    };
                                  })
                                }
                              >
                                <MaterialSymbol name="delete" className="text-[18px]" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {editFormError ? (
                  <p className="text-sm font-medium text-danger">{editFormError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setEditingForm(null);
                    setEditFormError(null);
                    setEditAvatarError(null);
                    setIsAddressModalOpen(false);
                    setIsPhoneModalOpen(false);
                    setAddressModalError(null);
                    setPhoneModalError(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSubmittingEdit}
                  startContent={
                    isSubmittingEdit ? null : (
                      <MaterialSymbol name="save" className="text-[18px]" />
                    )
                  }
                >
                  Salvar alterações
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isAddressModalOpen}
        onOpenChange={(isOpen) => {
          setIsAddressModalOpen(isOpen);
          if (!isOpen) {
            setAddressModalError(null);
            setEditingAddressIndex(null);
            setIsLookingUpAddressCep(false);
          }
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name="location_on"
                    className="text-[20px] text-primary"
                  />
                  {editingAddressIndex !== null ? "Editar endereço" : "Adicionar endereço"}
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Rótulo"
                    value={addressForm.label}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        label: value,
                      }))
                    }
                  />
                  <Input
                    label="País"
                    value={addressForm.country}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        country: value,
                      }))
                    }
                  />

                  <div className="flex items-end gap-2">
                    <Input
                      label="CEP"
                      value={addressForm.zipCode}
                      onValueChange={(value) =>
                        setAddressForm((currentAddress) => ({
                          ...currentAddress,
                          zipCode: normalizeZipCode(value),
                        }))
                      }
                      onBlur={() => {
                        if (
                          normalizeZipCode(addressForm.zipCode).length === 8 &&
                          !isLookingUpAddressCep
                        ) {
                          void handleLookupAddressZipCode();
                        }
                      }}
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      color="primary"
                      variant="flat"
                      isLoading={isLookingUpAddressCep}
                      isDisabled={
                        isLookingUpAddressCep ||
                        normalizeZipCode(addressForm.zipCode).length !== 8
                      }
                      startContent={
                        isLookingUpAddressCep ? null : (
                          <MaterialSymbol name="search" className="text-[18px]" />
                        )
                      }
                      onPress={() => {
                        void handleLookupAddressZipCode();
                      }}
                    >
                      CEP
                    </Button>
                  </div>

                  <label className="flex flex-col gap-1.5 text-sm text-foreground/80">
                    <span className="px-1 text-foreground/70">Tipo de via</span>
                    <select
                      className="h-14 rounded-xl border border-default-200 bg-content1 px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={addressForm.streetType}
                      onChange={(event) => {
                        const streetType = normalizeStreetType(event.target.value);
                        setAddressForm((currentAddress) => {
                          const streetName =
                            currentAddress.streetName || currentAddress.street;
                          return {
                            ...currentAddress,
                            streetType,
                            street: composeStreet(streetType, streetName),
                          };
                        });
                      }}
                    >
                      <option value="">Selecione</option>
                      <option value="rua">Rua</option>
                      <option value="avenida">Avenida</option>
                      <option value="travessa">Travessa</option>
                      <option value="alameda">Alameda</option>
                      <option value="rodovia">Rodovia</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>
                  <Input
                    label="Nome da via"
                    value={addressForm.streetName}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => {
                        const streetName = value;
                        return {
                          ...currentAddress,
                          streetName,
                          street: composeStreet(currentAddress.streetType, streetName),
                        };
                      })
                    }
                  />
                  <Input
                    label="Número"
                    value={addressForm.number}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        number: value,
                      }))
                    }
                  />
                  <Input
                    label="Bairro"
                    value={addressForm.neighborhood}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        neighborhood: value,
                      }))
                    }
                  />
                  <Input
                    label="Cidade"
                    value={addressForm.city}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        city: value,
                      }))
                    }
                  />
                  <Input
                    label="UF"
                    value={addressForm.state}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        state: value.toUpperCase().slice(0, 2),
                      }))
                    }
                    maxLength={2}
                  />
                  <Input
                    label="Complemento"
                    value={addressForm.complement}
                    onValueChange={(value) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        complement: value,
                      }))
                    }
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-default-300"
                    checked={addressForm.active}
                    onChange={(event) =>
                      setAddressForm((currentAddress) => ({
                        ...currentAddress,
                        active: event.target.checked,
                      }))
                    }
                  />
                  Endereço ativo
                </label>

                <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
                    Pré-visualização do mapa
                  </p>
                  {buildAddressMapUrl(addressForm) ? (
                    <iframe
                      title="Mapa do endereço"
                      src={buildAddressMapUrl(addressForm)}
                      className="mt-2 h-56 w-full rounded-lg border border-default-200"
                      loading="lazy"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-foreground/70">
                      Preencha rua, número, bairro, cidade ou CEP para visualizar o
                      mapa.
                    </p>
                  )}
                </div>

                {addressModalError ? (
                  <p className="text-sm font-medium text-danger">{addressModalError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setIsAddressModalOpen(false);
                    setAddressModalError(null);
                    setEditingAddressIndex(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={isSavingAddress}
                  startContent={
                    isSavingAddress ? null : (
                      <MaterialSymbol name="save" className="text-[18px]" />
                    )
                  }
                  onPress={handleSaveAddress}
                >
                  Salvar endereço
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isPhoneModalOpen}
        onOpenChange={(isOpen) => {
          setIsPhoneModalOpen(isOpen);
          if (!isOpen) {
            setPhoneModalError(null);
            setIsSavingPhone(false);
            setEditingPhoneIndex(null);
          }
        }}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol name="phone" className="text-[20px] text-primary" />
                  {editingPhoneIndex !== null ? "Editar telefone" : "Adicionar telefone"}
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="Rótulo"
                  value={phoneForm.label}
                  onValueChange={(value) =>
                    setPhoneForm((currentPhone) => ({
                      ...currentPhone,
                      label: value,
                    }))
                  }
                />
                <Input
                  label="Telefone"
                  value={phoneForm.phoneNumber}
                  onValueChange={(value) =>
                    setPhoneForm((currentPhone) => ({
                      ...currentPhone,
                      phoneNumber: value,
                    }))
                  }
                  isRequired
                />
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-default-300"
                    checked={phoneForm.isWhatsapp}
                    onChange={(event) =>
                      setPhoneForm((currentPhone) => ({
                        ...currentPhone,
                        isWhatsapp: event.target.checked,
                      }))
                    }
                  />
                  É WhatsApp
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-default-300"
                    checked={phoneForm.active}
                    onChange={(event) =>
                      setPhoneForm((currentPhone) => ({
                        ...currentPhone,
                        active: event.target.checked,
                      }))
                    }
                  />
                  Telefone ativo
                </label>

                {phoneModalError ? (
                  <p className="text-sm font-medium text-danger">{phoneModalError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setIsPhoneModalOpen(false);
                    setPhoneModalError(null);
                    setIsSavingPhone(false);
                    setEditingPhoneIndex(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={isSavingPhone}
                  startContent={
                    isSavingPhone ? null : (
                      <MaterialSymbol name="save" className="text-[18px]" />
                    )
                  }
                  onPress={handleSavePhone}
                >
                  Salvar telefone
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(viewingClient)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingClient(null);
          }
        }}
        placement="center"
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name="visibility"
                    className="text-[20px] text-primary"
                  />
                  Visualizar cliente
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                {viewingClient ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-lg font-semibold text-black dark:text-white">
                        {viewingClient.avatar ? (
                          <img
                            src={viewingClient.avatar}
                            alt={`Avatar de ${viewingClient.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getClientInitial(viewingClient.name, viewingClient.login)
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {viewingClient.name || "-"}
                        </p>
                        <p className="text-xs text-foreground/70">
                          {viewingClient.email || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoField label="ID" value={viewingClient.id} />
                      <InfoField label="Login" value={viewingClient.login} />
                      <InfoField
                        label="Status"
                        value={viewingClient.active ? "Ativo" : "Inativo"}
                      />
                      <InfoField
                        label="Criado em"
                        value={formatDateTime(viewingClient.created)}
                      />
                    </div>

                    <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
                        Endereços
                      </p>

                      {viewingClient.addresses.length === 0 ? (
                        <p className="mt-2 text-sm text-foreground/70">
                          Nenhum endereço cadastrado.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-3">
                          {viewingClient.addresses.map((address, index) => (
                            <div
                              key={address.id || `${address.street}-${index}`}
                              className="rounded-lg border border-default-200 bg-content1/70 p-3"
                            >
                              <p className="text-xs font-semibold text-foreground/80">
                                {address.label || `Endereço ${index + 1}`}
                              </p>
                              <p className="mt-1 text-sm text-foreground/80">
                                {formatAddressText(address)}
                              </p>
                              <p className="mt-1 text-xs text-foreground/70">
                                CEP: {formatZipCode(address.zipCode)}
                              </p>
                              {buildAddressMapUrl(address) ? (
                                <iframe
                                  title={`Mapa do endereço ${index + 1}`}
                                  src={buildAddressMapUrl(address)}
                                  className="mt-2 h-40 w-full rounded-lg border border-default-200"
                                  loading="lazy"
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
                        Telefones
                      </p>

                      {viewingClient.phones.length === 0 ? (
                        <p className="mt-2 text-sm text-foreground/70">
                          Nenhum telefone cadastrado.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {viewingClient.phones.map((phone, index) => (
                            <div
                              key={phone.id || `${phone.phoneNumber}-${index}`}
                              className="flex items-center justify-between rounded-lg border border-default-200 bg-content1/70 px-3 py-2"
                            >
                              <p className="text-sm text-foreground/80">
                                {phone.label || "Telefone"}: {phone.phoneNumber || "-"}
                              </p>
                              <span className="text-xs text-foreground/60">
                                {phone.isWhatsapp ? "WhatsApp" : "Telefone"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={closeModal}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDeactivateClient)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPendingDeactivateClient(null);
          }
        }}
        placement="center"
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <span className="inline-flex items-center gap-2">
                  <MaterialSymbol
                    name="toggle_off"
                    className="text-[20px] text-warning"
                  />
                  Desativar cliente
                </span>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-foreground/80">
                  Tem certeza que deseja desativar o cliente{" "}
                  <span className="font-semibold text-foreground">
                    {pendingDeactivateClient?.name}
                  </span>
                  ?
                </p>
                <p className="text-xs text-foreground/70">
                  Esta ação pode ser revertida depois ativando novamente.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                  onPress={() => {
                    setPendingDeactivateClient(null);
                    closeModal();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={isUpdatingStatus}
                  startContent={
                    isUpdatingStatus ? null : (
                      <MaterialSymbol name="delete" className="text-[18px]" />
                    )
                  }
                  onPress={() => {
                    void confirmDeactivateClient();
                  }}
                >
                  Confirmar desativação
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

interface ClientFormFieldsProps {
  form: ClientFormData;
  isCreateMode: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  avatarError: string | null;
  onFieldChange: (field: keyof ClientFormData, value: string | boolean) => void;
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearAvatar: () => void;
}

function ClientFormFields({
  form,
  isCreateMode,
  avatarInputRef,
  avatarError,
  onFieldChange,
  onAvatarFileChange,
  onClearAvatar,
}: ClientFormFieldsProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="Nome"
          value={form.name}
          onValueChange={(value) => onFieldChange("name", value)}
          isRequired
        />
        <Input
          label="Email"
          value={form.email}
          onValueChange={(value) => onFieldChange("email", value)}
          type="email"
          isRequired
        />
      </div>

      <div className="rounded-xl border border-default-200 bg-default-50 p-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
          <MaterialSymbol name="key" className="text-[16px]" />
          Credenciais de acesso
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Input
            label="Login"
            value={form.login}
            onValueChange={(value) => onFieldChange("login", value)}
            isRequired
          />
          <Input
            label={isCreateMode ? "Senha" : "Nova senha (opcional)"}
            value={form.password}
            onValueChange={(value) => onFieldChange("password", value)}
            type="password"
            isRequired={isCreateMode}
            placeholder={isCreateMode ? "Informe a senha" : "Preencha para alterar"}
          />
          <label className="flex items-center gap-2 pt-7 text-sm text-foreground/80">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-default-300"
              checked={form.active}
              onChange={(event) => onFieldChange("active", event.target.checked)}
            />
            Cliente ativo
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-default-200 bg-default-50 p-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
          <MaterialSymbol name="add_a_photo" className="text-[16px]" />
          Avatar
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-xl font-semibold text-black dark:text-white">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt="Avatar do cliente"
                className="h-full w-full object-cover"
              />
            ) : (
              getClientInitial(form.name, form.login)
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarFileChange}
            />

            <Button
              type="button"
              variant="flat"
              startContent={<MaterialSymbol name="upload" className="text-[18px]" />}
              onPress={() => avatarInputRef.current?.click()}
            >
              Enviar avatar
            </Button>
            <Button
              type="button"
              variant="light"
              startContent={<MaterialSymbol name="delete" className="text-[18px]" />}
              onPress={onClearAvatar}
            >
              Remover
            </Button>
          </div>
        </div>

        {avatarError ? (
          <p className="mt-2 text-xs font-medium text-danger">{avatarError}</p>
        ) : (
          <p className="mt-2 text-xs text-foreground/70">
            Formatos aceitos: imagem. Tamanho máximo: 1MB.
          </p>
        )}
      </div>
    </>
  );
}

function toClientForm(client: ClientDetail): ClientFormData {
  return {
    id: client.id,
    name: client.name || "",
    email: client.email || "",
    login: client.login || "",
    password: "",
    avatar: client.avatar || "",
    active: Boolean(client.active),
    addresses:
      client.addresses.length > 0
        ? normalizeAddressPositions(
            client.addresses.map((address, index) => ({
              id: address.id,
              clientId: address.clientId,
              label: address.label || `Endereço ${index + 1}`,
              country: address.country || "Brasil",
              zipCode: normalizeZipCode(address.zipCode || ""),
              streetType: normalizeStreetType(address.streetType || splitStreet(address.street || "").streetType),
              streetName:
                address.streetName || splitStreet(address.street || "").streetName || "",
              street:
                address.street ||
                composeStreet(
                  normalizeStreetType(address.streetType || splitStreet(address.street || "").streetType),
                  address.streetName || splitStreet(address.street || "").streetName || "",
                ),
              number: address.number || "",
              neighborhood: address.neighborhood || "",
              city: address.city || "",
              state: (address.state || "").toUpperCase(),
              complement: address.complement || "",
              latitude: address.latitude,
              longitude: address.longitude,
              position: index,
              active: address.active !== false,
            })),
          )
        : [],
    phones:
      client.phones.length > 0
        ? normalizePhonePositions(
            client.phones.map((phone, index) => ({
              id: phone.id,
              clientId: phone.clientId,
              label: phone.label || "Principal",
              phoneNumber: phone.phoneNumber || "",
              isWhatsapp: Boolean(phone.isWhatsapp),
              position: index,
              active: phone.active !== false,
            })),
          )
        : [],
  };
}

function normalizeClientDetail(client: ClientDetail): ClientDetail {
  return {
    ...client,
    avatar: client.avatar || "",
    addresses: Array.isArray(client.addresses) ? client.addresses : [],
    phones: Array.isArray(client.phones) ? client.phones : [],
  };
}

function normalizeAddressPositions(addresses: ClientAddress[]): ClientAddress[] {
  return addresses.map((address, index) => ({
    ...address,
    position: index,
  }));
}

function normalizePhonePositions(phones: ClientPhone[]): ClientPhone[] {
  return phones.map((phone, index) => ({
    ...phone,
    position: index,
  }));
}

function buildClientPayload(
  form: ClientFormData,
  requirePassword: boolean,
):
  | {
      name: string;
      email: string;
      login: string;
      password: string;
      avatar: string;
      active: boolean;
      addresses: Array<{
        label: string;
        country: string;
        zipCode: string;
        streetType: string;
        streetName: string;
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        complement: string;
        position: number;
        active: boolean;
      }>;
      phones: Array<{
        label: string;
        phoneNumber: string;
        isWhatsapp: boolean;
        position: number;
        active: boolean;
      }>;
    }
  | string {
  const name = form.name.trim();
  const email = form.email.trim();
  const login = form.login.trim().toLowerCase();
  const password = form.password.trim();

  if (!name || !email || !login) {
    return "Nome, email e login são obrigatórios.";
  }

  if (requirePassword && !password) {
    return "Senha é obrigatória para cadastrar o cliente.";
  }

  const addresses = normalizeAddressPositions(form.addresses)
    .map((address, index) => ({
      label: address.label.trim(),
      country: address.country.trim() || "Brasil",
      zipCode: normalizeZipCode(address.zipCode),
      streetType: normalizeStreetType(address.streetType),
      streetName: address.streetName.trim() || address.street.trim(),
      street: composeStreet(
        normalizeStreetType(address.streetType),
        address.streetName.trim() || address.street.trim(),
      ),
      number: address.number.trim(),
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim().toUpperCase(),
      complement: address.complement.trim(),
      position: index,
      active: address.active !== false,
    }))
    .filter(
      (address) =>
        address.zipCode ||
        address.street ||
        address.number ||
        address.neighborhood ||
        address.city ||
        address.state ||
        address.complement,
    );

  for (const address of addresses) {
    if (address.zipCode && address.zipCode.length !== 8) {
      return "Todos os CEPs informados devem ter 8 dígitos.";
    }
  }

  const phones = normalizePhonePositions(form.phones)
    .map((phone, index) => ({
      label: phone.label.trim(),
      phoneNumber: phone.phoneNumber.trim(),
      isWhatsapp: Boolean(phone.isWhatsapp),
      position: index,
      active: phone.active !== false,
    }))
    .filter((phone) => phone.phoneNumber);

  return {
    name,
    email,
    login,
    password,
    avatar: form.avatar || "",
    active: Boolean(form.active),
    addresses,
    phones,
  };
}

function buildAddressMapUrl(address: ClientAddress): string {
  const street =
    (address.street || "").trim() ||
    composeStreet(address.streetType, address.streetName) ||
    "";
  const parts = [
    street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    formatZipCode(address.zipCode),
  ]
    .map((value) => (value || "").trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  const query = encodeURIComponent(parts.join(", "));
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function formatAddressText(address: ClientAddress): string {
  const street =
    (address.street || "").trim() ||
    composeStreet(address.streetType, address.streetName) ||
    "";
  const parts = [
    [street, address.number].filter(Boolean).join(" "),
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(" - "),
  ]
    .map((value) => (value || "").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "-";
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as ApiError).error === "string" &&
    (payload as ApiError).error?.trim()
  ) {
    return (payload as ApiError).error?.trim() || fallback;
  }

  return fallback;
}

function getClientInitial(name?: string, login?: string): string {
  const source = (name || login || "C").trim();
  return source.charAt(0).toUpperCase();
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function readTokenFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("admin_token="));
  if (!cookie) {
    return "";
  }

  return decodeURIComponent(cookie.split("=")[1] || "").trim();
}

function normalizeZipCode(value: string): string {
  return (value || "").replace(/\D/g, "").slice(0, 8);
}

function formatZipCode(value: string): string {
  const zip = normalizeZipCode(value);
  if (zip.length !== 8) {
    return zip;
  }

  return `${zip.slice(0, 5)}-${zip.slice(5)}`;
}

function normalizeStreetType(value: string): string {
  const normalized = (value || "").trim().toLowerCase();
  switch (normalized) {
    case "":
    case "rua":
      return normalized;
    case "av":
    case "av.":
    case "avenida":
      return "avenida";
    case "trav":
    case "trav.":
    case "tv":
    case "tv.":
    case "travessa":
      return "travessa";
    case "al":
    case "al.":
    case "alameda":
      return "alameda";
    case "rod":
    case "rod.":
    case "rodovia":
      return "rodovia";
    default:
      return "outro";
  }
}

function splitStreet(street: string): { streetType: string; streetName: string } {
  const normalizedStreet = (street || "").trim();
  if (!normalizedStreet) {
    return { streetType: "", streetName: "" };
  }

  const lowered = normalizedStreet.toLowerCase();
  if (lowered.startsWith("rua ")) {
    return { streetType: "rua", streetName: normalizedStreet.slice(4).trim() };
  }
  if (lowered.startsWith("avenida ")) {
    return { streetType: "avenida", streetName: normalizedStreet.slice(8).trim() };
  }
  if (lowered.startsWith("av. ")) {
    return { streetType: "avenida", streetName: normalizedStreet.slice(4).trim() };
  }
  if (lowered.startsWith("av ")) {
    return { streetType: "avenida", streetName: normalizedStreet.slice(3).trim() };
  }
  if (lowered.startsWith("travessa ")) {
    return { streetType: "travessa", streetName: normalizedStreet.slice(9).trim() };
  }
  if (lowered.startsWith("trav. ")) {
    return { streetType: "travessa", streetName: normalizedStreet.slice(6).trim() };
  }
  if (lowered.startsWith("trav ")) {
    return { streetType: "travessa", streetName: normalizedStreet.slice(5).trim() };
  }
  if (lowered.startsWith("tv. ")) {
    return { streetType: "travessa", streetName: normalizedStreet.slice(4).trim() };
  }
  if (lowered.startsWith("tv ")) {
    return { streetType: "travessa", streetName: normalizedStreet.slice(3).trim() };
  }
  if (lowered.startsWith("alameda ")) {
    return { streetType: "alameda", streetName: normalizedStreet.slice(8).trim() };
  }
  if (lowered.startsWith("rodovia ")) {
    return { streetType: "rodovia", streetName: normalizedStreet.slice(8).trim() };
  }

  return { streetType: "", streetName: normalizedStreet };
}

function composeStreet(streetType: string, streetName: string): string {
  const type = normalizeStreetType(streetType);
  const name = (streetName || "").trim();
  if (!name) {
    return "";
  }

  switch (type) {
    case "rua":
      return `Rua ${name}`;
    case "avenida":
      return `Avenida ${name}`;
    case "travessa":
      return `Travessa ${name}`;
    case "alameda":
      return `Alameda ${name}`;
    case "rodovia":
      return `Rodovia ${name}`;
    default:
      return name;
  }
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}
