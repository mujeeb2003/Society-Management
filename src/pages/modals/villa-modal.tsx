import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Villas } from "@/types"


type VillaModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (villa: Villas) => void
  villaToEdit?: Villas | null
}

export function VillaModal({ isOpen, onClose, onSave, villaToEdit }: VillaModalProps) {
  const [villa, setVilla] = useState<Villas>({
    id: 0,
    villa_number: "",
    owner_name: "",
    resident_name: "",
    occupancy_type: "owner",
    Payable: 0,
  })

  useEffect(() => {
    if (villaToEdit) {
      setVilla(villaToEdit)
    } else {
      setVilla({
        id: 0,
        villa_number: "",
        owner_name: "",
        resident_name: "",
        occupancy_type: "owner",
        Payable: 0,
      })
    }
  }, [villaToEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setVilla((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    onSave(villa)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{villaToEdit ? "Edit Villa" : "Add New Villa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="villa_number" className="text-right">
              Villa Number
            </Label>
            <Input
              id="villa_number"
              name="villa_number"
              value={villa.villa_number}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner_name" className="text-right">
              Owner Name
            </Label>
            <Input
              id="owner_name"
              name="owner_name"
              value={villa.owner_name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="resident_name" className="text-right">
              Resident Name
            </Label>
            <Input
              id="resident_name"
              name="resident_name"
              value={villa.resident_name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="occupancy_type" className="text-right">
              Occupancy Type
            </Label>
            <Select
              onValueChange={(value) => setVilla((prev) => ({ ...prev, occupancy_type: value as "owner" | "tenant" }))}
              defaultValue={villa.occupancy_type}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select occupancy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Payable" className="text-right">
              Payable
            </Label>
            <Input
              id="Payable"
              name="Payable"
              type="number"
              value={villa.Payable}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


