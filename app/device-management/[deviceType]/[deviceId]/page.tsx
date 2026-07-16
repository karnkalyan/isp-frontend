"use client"
import { useParams } from "next/navigation";import { DeviceWorkspace } from "@/components/device-management/device-workspace";import { DEVICE_TYPES,type DeviceType } from "@/lib/device-management";
export default function ManagedDevicePage(){const params=useParams<{deviceType:string;deviceId:string}>(),type=params.deviceType as DeviceType,id=Number(params.deviceId);if(!DEVICE_TYPES[type]||!Number.isInteger(id))return <div className="p-8">Invalid device route.</div>;return <DeviceWorkspace deviceType={type} deviceId={id}/>}
