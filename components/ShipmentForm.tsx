"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Calculator, Send, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import ItemRow from "./ItemRow"
import type { ShipmentFormData, ShipmentItem } from "@/app/types/shipment"
import { getToken } from "@/lib/auth"
import { toast } from "react-hot-toast"

interface CarrierQuote {
  transport_name: string
  price: number
  available: boolean
  errorMessage?: string
}

interface RawQuote {
  transport_name: string
  price: number
  [key: string]: any
}

export default function ShipmentForm() {
  const router = useRouter()

  const emptyItem: ShipmentItem = {
    description: "",
    category: "",
    quantity: "1",
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
  }

  const [formData, setFormData] = useState<ShipmentFormData>({
    pickupAddress: "",
    deliveryAddress: "",
    shippingOption: "",
    specialInstructions: "",
    items: [{ ...emptyItem }],
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationDone, setCalculationDone] = useState(false)
  const [carrierQuotes, setCarrierQuotes] = useState<CarrierQuote[]>([])
  const [isRequestingQuote, setIsRequestingQuote] = useState(false)
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null)
  const [quoteRequestSuccess, setQuoteRequestSuccess] = useState<string | null>(null)
  const token = getToken()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

    setFormData({ ...formData, [name]: newValue })
    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const handleItemChange = (index: number, updatedItem: ShipmentItem) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = updatedItem
    setFormData({ ...formData, items: updatedItems })
    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem }],
    })
    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = [...formData.items]
    updatedItems.splice(index, 1)
    setFormData({ ...formData, items: updatedItems })
    if (calculationDone) {
      setCalculationDone(false)
      setCarrierQuotes([])
    }
  }

  const totalWeight = formData.items.reduce(
    (sum, item) => sum + (parseFloat(item.weight) * parseInt(item.quantity) || 0),
    0,
  )
  const totalQuantity = formData.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
  const totalLength = formData.items.reduce((sum, item) => sum + (parseFloat(item.dimensions.length) || 0), 0)
  const totalWidth = formData.items.reduce((sum, item) => sum + (parseFloat(item.dimensions.width) || 0), 0)
  const totalHeight = formData.items.reduce((sum, item) => sum + (parseFloat(item.dimensions.height) || 0), 0)

  const isFormValid =
    formData.pickupAddress &&
    formData.deliveryAddress &&
    formData.shippingOption &&
    formData.items.length > 0 &&
    formData.items.every((item) => {
      const quantity = Number(item.quantity)
      const isValidQuantity =
        !isNaN(quantity) && Number.isInteger(quantity) && quantity >= 1 && !item.quantity.includes(".")
      return (
        item.description &&
        item.category &&
        isValidQuantity &&
        item.weight &&
        item.dimensions.length &&
        item.dimensions.width &&
        item.dimensions.height
      )
    })

  const handleCalculate = async () => {
    if (!isFormValid) return

    setIsCalculating(true)
    setCarrierQuotes([])

    try {
      const payload = {
        pick_up_address: formData.pickupAddress,
        delivery_address: formData.deliveryAddress,
        shipping_option: formData.shippingOption,
        shipments: formData.items.map((item) => ({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          weight: item.weight,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
        })),
      }

      const response = await fetch(`https://www.hungryblogs.com/api/GetQuote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()

      if (!response.ok || responseText.includes("Sorry We Don't deliver to this address")) {
        const message = responseText.replace(/"/g, "")
        const unavailableQuotes: CarrierQuote[] = ["TNT", "TGE"].map((carrier) => ({
          transport_name: carrier,
          price: 0,
          available: false,
          errorMessage: message,
        }))
        setCarrierQuotes(unavailableQuotes)
        setCalculationDone(true)
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error("Invalid response format from server")
      }

      let quotesArray: RawQuote[] = []

      if (Array.isArray(data)) {
        quotesArray = data as RawQuote[]
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.quotes)) quotesArray = data.quotes as RawQuote[]
        else if (Array.isArray(data.data)) quotesArray = data.data as RawQuote[]
        else if (Array.isArray(data.results)) quotesArray = data.results as RawQuote[]
        else throw new Error("No valid quote array found")
      }

      const allCarriers = ["TNT", "TGE"]
      const formattedQuotes: CarrierQuote[] = allCarriers.map((carrier) => {
        const match = quotesArray.find((q) => q.transport_name === carrier)
        return match
          ? { ...match, available: true }
          : { transport_name: carrier, price: 0, available: false }
      })

      setCarrierQuotes(formattedQuotes)
      setCalculationDone(true)
    } catch (err) {
      toast.error("Failed to calculate shipping quotes. Please try again.")

      const unavailableQuotes: CarrierQuote[] = ["TNT", "TGE"].map((carrier) => ({
        transport_name: carrier,
        price: 0,
        available: false,
        errorMessage: "Unable to get quotes at this time. Please try again later.",
      }))
      setCarrierQuotes(unavailableQuotes)
      setCalculationDone(true)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleRequestQuote = async (carrierName: string) => {
    setIsRequestingQuote(true)
    setSelectedCarrier(carrierName)

    try {
      const quotePayload = {
        pick_up_address: formData.pickupAddress,
        delivery_address: formData.deliveryAddress,
        shipping_option: formData.shippingOption,
        transport_name: carrierName,
        price: carrierQuotes.find((c) => c.transport_name === carrierName)?.price.toString() || "0",
        shipments: formData.items.map((item) => ({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          weight: item.weight,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
        })),
      }

      const response = await fetch("https://www.hungryblogs.com/api/RequestQuote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quotePayload),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to send quote request: ${response.status} - ${errText}`)
      }

      toast.success("Quote request sent successfully.")
      setQuoteRequestSuccess(
        `Quote request for ${carrierName} sent successfully! Our team will contact you soon with a detailed quote.`,
      )

      setTimeout(() => setQuoteRequestSuccess(null), 5000)
      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to send quote request. Please try again or contact support.")
    } finally {
      setIsRequestingQuote(false)
      setSelectedCarrier(null)
    }
  }

  const clearForm = () => {
    setFormData({
      pickupAddress: "",
      deliveryAddress: "",
      shippingOption: "",
      specialInstructions: "",
      items: [{ ...emptyItem }],
    })
    setCalculationDone(false)
    setCarrierQuotes([])
  }

  // UI JSX continues here...
}
