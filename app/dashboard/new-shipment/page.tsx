"use client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ShipmentForm from "@/components/ShipmentForm"

export default function NewShipment() {
  return (
    <div className="bg-white">
      <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft size={16} className="mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-black mb-6">Create New Shipment</h1>

      <ShipmentForm />
    </div>
  )
}
