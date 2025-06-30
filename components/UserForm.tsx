"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, AlertCircle, User, Mail, Building, Phone, MapPin, Percent, Shield } from "lucide-react"
import type { UserFormData } from "@/app/types/user"
import { getToken } from "@/lib/auth"

const countryCodes: Record<string, string> = {
  Australia: "+61",
}

const australianStates = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
]

interface UserFormProps {
  initialData?: Partial<UserFormData>
  isEditing?: boolean
  userId?: string
}

export default function UserForm({ initialData, isEditing = false, userId }: UserFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<UserFormData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    role: initialData?.role || "user",
    status: initialData?.status || "active",
    company: initialData?.company || "",
    phone: initialData?.phone || "",
    password: initialData?.password || "",
    confirmPassword: initialData?.confirmPassword || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "Victoria",
    zipCode: initialData?.zipCode || "",
    country: initialData?.country || "Australia",
    commission: initialData?.commission || 0,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [phoneWithoutCode, setPhoneWithoutCode] = useState("")
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [phoneCheckError, setPhoneCheckError] = useState("")
  const token = getToken()
  const [showAdminWarning, setShowAdminWarning] = useState(false)

  useEffect(() => {
    if (isEditing && initialData?.phone) {
      const phoneDigits = initialData.phone.replace(/\D/g, "")
      let cleanPhone = phoneDigits
      if (phoneDigits.startsWith("61") && phoneDigits.length > 9) {
        cleanPhone = phoneDigits.substring(2)
      }

      cleanPhone = cleanPhone.slice(-9)

      setPhoneWithoutCode(cleanPhone)
    }
  }, [isEditing, initialData])

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData((prev) => ({
        ...prev,
        status: initialData.status || "active",
        role: initialData.role || "user",
        commission: initialData.commission || 0,
      }))
    }
  }, [isEditing, initialData])

  useEffect(() => {
    const fetchUserData = async () => {
      if (isEditing && userId && (!initialData || Object.keys(initialData).length === 0 || !initialData.phone)) {
        try {
          const token = getToken()
          if (!token) {
            console.error("No auth token found")
            return
          }

          const response = await fetch(`https://hungryblogs.com/api/GetUser/?id=${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status}`)
          }

          const data = await response.json()

          const userDetails = data.details?.[0]

          if (userDetails) {
            let phoneWithoutCountryCode = ""
            if (userDetails.phone_number) {
              const phoneDigits = userDetails.phone_number.replace(/\D/g, "")

              let cleanPhone = phoneDigits
              if (phoneDigits.startsWith("61") && phoneDigits.length > 9) {
                cleanPhone = phoneDigits.substring(2)
              }

              cleanPhone = cleanPhone.slice(-9)

              phoneWithoutCountryCode = cleanPhone
            }

            setPhoneWithoutCode(phoneWithoutCountryCode)

            const newFormData = {
              firstName: userDetails.first_name || "",
              lastName: userDetails.last_name || "",
              email: userDetails.email || "",
              role: userDetails.user_role || "user",
              status: userDetails.user_status || "active",
              company: userDetails.company || "",
              phone: userDetails.phone_number || "",
              password: "",
              confirmPassword: "",
              address: userDetails.street || "",
              city: userDetails.city || "",
              state: userDetails.state || "Victoria",
              zipCode: userDetails.zip_code || "",
              country: userDetails.country || "Australia",
              commission: userDetails.commission || 0,
            }

            setFormData(newFormData)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

    fetchUserData()
  }, [isEditing, userId, initialData])

  const checkPhoneNumber = async (phone: string) => {
    if (!phone || phone.length < 9) return

    setIsCheckingPhone(true)
    setPhoneCheckError("")

    try {
      const response = await fetch(`https://hungryblogs.com/api/CheckPhoneNumber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: phone,
          exclude_user_id: isEditing ? userId : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setPhoneCheckError("This phone number is already registered")
        }
      }
    } catch (error) {
      console.error("Error checking phone number:", error)
    } finally {
      setIsCheckingPhone(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "")
      const limitedDigits = digitsOnly.slice(0, 9)

      setPhoneWithoutCode(limitedDigits)
      const countryCode = countryCodes[formData.country]
      const fullPhone = `${countryCode} ${limitedDigits}`.trim()

      setFormData((prev) => ({
        ...prev,
        phone: fullPhone,
      }))

      setPhoneCheckError("")

      if (limitedDigits.length === 9) {
        setTimeout(() => checkPhoneNumber(fullPhone), 500)
      }
    } else if (name === "zipCode") {
      const digitsOnly = value.replace(/\D/g, "")
      const limitedDigits = digitsOnly.slice(0, 4)
      setFormData((prev) => ({
        ...prev,
        zipCode: limitedDigits,
      }))
    } else if (name === "commission") {
      const commissionValue = Number.parseFloat(value)
      setFormData((prev) => ({
        ...prev,
        commission: isNaN(commissionValue) ? 0 : commissionValue,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }))
    }

    if (errors[name as keyof UserFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }

    if (apiError) {
      setApiError(null)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!phoneWithoutCode) {
      newErrors.phone = "Phone number is required"
    } else if (!/^\d{9}$/.test(phoneWithoutCode)) {
      newErrors.phone = "Phone number must be exactly 9 digits"
    } else if (phoneCheckError) {
      newErrors.phone = phoneCheckError
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = "Password is required"
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    if (!formData.zipCode) {
      newErrors.zipCode = "Postal code is required"
    } else if (!/^\d{4}$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid 4-digit Australian postal code"
    }

    if (isEditing && formData.commission !== undefined) {
      if (formData.commission < 0) {
        newErrors.commission = "Commission cannot be negative"
      } else if (formData.commission > 100) {
        newErrors.commission = "Commission cannot exceed 100%"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const isCreatingAdmin = !isEditing && formData.role === "admin"
    const isChangingToAdmin = isEditing && formData.role === "admin" && initialData?.role !== "admin"

    if ((isCreatingAdmin || isChangingToAdmin) && !showAdminWarning) {
      setShowAdminWarning(true)
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      const apiUrl = isEditing ? `https://hungryblogs.com/api/UpdateUser` : `https://hungryblogs.com/api/CreateNewUser`

      const payload = {
        ...(isEditing && userId ? { id: userId } : {}),
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        user_role: formData.role,
        ...(formData.company?.trim() ? { company: formData.company.trim() } : {}),
        phone_number: formData.phone,
        street: formData.address,
        city: formData.city || "",
        state: formData.state,
        zip_code: formData.zipCode,
        country: formData.country,
        ...(isEditing ? { commission: formData.commission } : {}),
        ...(isEditing ? {} : { password: formData.password }),
        ...(isEditing ? { user_status: formData.status } : {}),
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API error: ${response.status}`)
      }

      setSubmitSuccess(true)

      if (isEditing) {
      } else {
      }

      setTimeout(() => {
        router.push("/admin/users")
      }, 1500)
    } catch (error) {
      console.error("Error saving user:", error)
      setApiError(
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again or contact support.",
      )
    } finally {
      setIsSubmitting(false)
      setShowAdminWarning(false)
    }
  }

  return (
    <>
      {showAdminWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Shield className="text-orange-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-black">Administrator Access Warning</h3>
            </div>
            <p className="text-gray-700 mb-4">
              You are about to {isEditing ? "change this user to" : "create"} an administrator account. Admin users have
              full access to:
            </p>
            <ul className="text-gray-700 mb-6 ml-4 list-disc">
              <li>Manage all users and their data</li>
              <li>View and modify system settings</li>
              <li>Access all quotes and shipments</li>
              <li>Manage rates and pricing</li>
            </ul>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAdminWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAdminWarning(false)
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded flex items-center"
              >
                <Shield size={16} className="mr-2" />
                Continue & Create Admin
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-3xl border border-gray-300">
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-md flex items-center text-green-700">
            <Check size={20} className="mr-2 flex-shrink-0" />
            <span>User successfully {isEditing ? "updated" : "created"}! Redirecting...</span>
          </div>
        )}

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-md flex items-center text-red-700">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="firstName" className="block font-semibold text-black mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`pl-10 border p-2 w-full rounded text-black ${
                  errors.firstName ? "border-red-500" : "border-gray-400"
                }`}
                disabled={isSubmitting}
                required
              />
            </div>
            {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className="block font-semibold text-black mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`pl-10 border p-2 w-full rounded text-black ${
                  errors.lastName ? "border-red-500" : "border-gray-400"
                }`}
                disabled={isSubmitting}
                required
              />
            </div>
            {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="email" className="block font-semibold text-black mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={16} className="text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`pl-10 border p-2 w-full rounded text-black ${
                errors.email ? "border-red-500" : "border-gray-400"
              }`}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="mb-6 border-t border-gray-300 pt-6">
          <h3 className="text-lg font-semibold text-black mb-4">Address Information</h3>

          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`pl-10 w-full border rounded-md py-2 px-3 text-black ${
                  errors.address ? "border-red-500" : "border-gray-400"
                }`}
                disabled={isSubmitting}
                required
              />
            </div>
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City/Suburb
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-md py-2 px-3 text-black"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Territory
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-md py-2 px-3 text-black"
                disabled={isSubmitting}
              >
                {australianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={`w-full border rounded-md py-2 px-3 text-black ${
                  errors.zipCode ? "border-red-500" : "border-gray-400"
                }`}
                maxLength={4}
                placeholder="3000"
                disabled={isSubmitting}
                required
              />
              {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-md py-2 px-3 text-black"
                disabled={isSubmitting}
              >
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="company" className="block font-semibold text-black mb-2">
              Company <span className="text-gray-500 text-sm">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="pl-10 border border-gray-400 p-2 w-full rounded text-black"
                disabled={isSubmitting}
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block font-semibold text-black mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={16} className="text-gray-400" />
              </div>
              <div className="flex items-center">
                <div className="pl-10 pr-2 py-2 bg-gray-100 border border-r-0 border-gray-400 rounded-l-md text-gray-700 font-medium">
                  {countryCodes[formData.country]}
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phoneWithoutCode}
                  onChange={(e) => handleChange({ ...e, target: { ...e.target, name: "phone" } })}
                  className={`border border-l-0 p-2 w-full rounded-r-md text-black ${
                    errors.phone || phoneCheckError ? "border-red-500" : "border-gray-400"
                  }`}
                  disabled={isSubmitting}
                  placeholder="412345678"
                  maxLength={9}
                  required
                />
              </div>
              {isCheckingPhone && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                </div>
              )}
            </div>
            {(errors.phone || phoneCheckError) && (
              <p className="mt-1 text-sm text-red-500">{errors.phone || phoneCheckError}</p>
            )}
            <p className="mt-1 text-sm text-gray-600">Enter 9 digits (e.g., 412345678)</p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="role" className="block font-semibold text-black mb-2">
            User Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border border-gray-400 p-2 w-full rounded text-black"
            disabled={isSubmitting}
            required
          >
            <option value="user">Regular User</option>
            <option value="admin">Administrator</option>
          </select>
          <p className="mt-1 text-sm text-gray-700">
            {formData.role === "admin" ? (
              <span className="text-orange-600 font-medium">
                ⚠️ Administrators have full access to manage users and system settings.
              </span>
            ) : (
              "Regular users have access to their own data and basic functionality."
            )}
          </p>
        </div>

        {isEditing && (
          <div className="mb-6">
            <label htmlFor="status" className="block font-semibold text-black mb-2">
              User Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border border-gray-400 p-2 w-full rounded text-black"
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
            <p className="mt-1 text-sm text-gray-700">
              Current status: <span className="font-medium">{formData.status}</span> - Pending and Blocked users will
              not be able to log in.
            </p>
          </div>
        )}

        {isEditing && (
          <div className="mb-6 border-t border-gray-300 pt-6">
            <label htmlFor="commission" className="block font-semibold text-black mb-2">
              Commission Rate (%)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent size={16} className="text-gray-400" />
              </div>
              <input
                type="number"
                id="commission"
                name="commission"
                value={formData.commission}
                onChange={handleChange}
                step="0.1"
                className={`pl-10 border p-2 w-full rounded text-black ${
                  errors.commission ? "border-red-500" : "border-gray-400"
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.commission && <p className="mt-1 text-sm text-red-500">{errors.commission}</p>}
            <p className="mt-1 text-sm text-gray-700">
              Commission percentage for this user. Enter a value between 0 and 100.
            </p>
          </div>
        )}

        {!isEditing && (
          <div className="border-t border-gray-300 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-black mb-4">Set Password</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="password" className="block font-semibold text-black mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded text-black ${
                      errors.password ? "border-red-500" : "border-gray-400"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                <p className="mt-1 text-sm text-gray-700">Password must be at least 8 characters long.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block font-semibold text-black mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded text-black ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-400"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="px-6 py-2 border border-gray-400 rounded hover:bg-gray-100 text-black"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCheckingPhone}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </button>
        </div>
      </form>
    </>
  )
}
