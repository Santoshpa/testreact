export async function fetchShipments(token: string) {
  const res = await fetch("https://www.hungryblogs.com/api/GetShipments", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch shipments")
  }

  const data = await res.json()
  return data.details || []
}

export async function sendResetCode(email: string) {
  const res = await fetch("https://www.hungryblogs.com/api/SendResetCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || "Failed to send reset code")
  }

  return await res.json()
}

export async function verifyResetCode(email: string, token: string, password: string) {
  const res = await fetch(
    `https://www.hungryblogs.com/api/VerifyResetCode?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  )

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || "Failed to verify reset code")
  }

  return await res.json()
}

export async function checkEmail(email: string) {
  const res = await fetch("https://www.hungryblogs.com/api/CheckEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || "Failed to check email")
  }

  return await res.json()
}

export async function checkPhoneNumber(phoneNumber: string) {
  const res = await fetch("https://www.hungryblogs.com/api/CheckPhoneNumber", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ phoneNumber }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || "Failed to check phone number")
  }

  return await res.json()
}
