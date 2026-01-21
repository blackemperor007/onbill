"use client"

import { useState, useRef, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Loader2, 
  Globe, 
  CreditCard, 
  Upload, 
  Image as ImageIcon,
  X
} from "lucide-react"
import Image from "next/image"

interface OnboardingFormProps {
  userId: string
  userEmail: string
  userName?: string
}

export default function OnboardingForm({ userId, userEmail, userName }: OnboardingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: userEmail,
    phone: "",
    address: "",
    currency: "EUR",
    language: "fr",
    logo: null as File | null
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image valide (JPG, PNG, etc.)")
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5MB)")
      return
    }

    setFormData(prev => ({ ...prev, logo: file }))
    
    // Créer un aperçu
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError("")
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }))
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName.trim()) {
      setError("Le nom de l'entreprise est obligatoire")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Créer FormData pour gérer l'upload de fichier
      const formDataToSend = new FormData()
      formDataToSend.append("userId", userId)
      formDataToSend.append("companyName", formData.companyName.trim())
      formDataToSend.append("companyEmail", formData.companyEmail.trim() || "")
      formDataToSend.append("phone", formData.phone.trim() || "")
      formDataToSend.append("address", formData.address.trim() || "")
      formDataToSend.append("currency", formData.currency)
      formDataToSend.append("language", formData.language)
      
      if (formData.logo) {
        formDataToSend.append("logo", formData.logo)
      }

      const response = await fetch("/api/company/create", {
        method: "POST",
        body: formDataToSend,
        // Note: Ne pas mettre Content-Type header, le browser le fera automatiquement avec FormData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création")
      }

      // Rediriger vers le dashboard
      router.push("/dashboard")
      router.refresh()

    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("")
  }

  return (
    <Card className="w-full max-w-2xl border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl md:text-3xl">
          Créez votre entreprise
        </CardTitle>
        <CardDescription className="text-base">
          Dernière étape pour commencer à utiliser FacturEasy
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section utilisateur */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Vos informations</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nom</Label>
                <Input
                  id="user-name"
                  value={userName || "Non spécifié"}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  value={userEmail}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section entreprise */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Informations de votre entreprise</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                Obligatoire
              </Badge>
            </div>

            {/* Nom de l'entreprise */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-1">
                Nom de l'entreprise
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Ex: Ma Société SARL"
                required
                disabled={isLoading}
                className="h-11 text-base"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Ce nom apparaîtra sur vos factures et documents
              </p>
            </div>

            {/* Logo de l'entreprise */}
            <div className="space-y-3">
              <Label htmlFor="logo" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logo de l'entreprise <span className="text-muted-foreground text-xs">(optionnel)</span>
              </Label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Zone d'aperçu */}
                {logoPreview ? (
                  <div className="relative">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/20 overflow-hidden bg-muted/30">
                      <Image
                        src={logoPreview}
                        alt="Aperçu du logo"
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}

                {/* Zone d'upload */}
                <div className="flex-1">
                  <Input
                    id="logo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {formData.logo ? "Changer le logo" : "Télécharger un logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Formats acceptés : JPG, PNG, GIF, SVG (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email et téléphone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de l'entreprise
                </Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder="contact@entreprise.com"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 1 23 45 67 89"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Rue de l'Exemple, 75000 Paris, France"
                rows={3}
                disabled={isLoading}
                className="resize-none"
              />
            </div>

            {/* Devise et Langue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Devise
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="currency" className="h-11">
                    <SelectValue placeholder="Sélectionnez une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€) - EUR</SelectItem>
                    <SelectItem value="USD">Dollar américain ($) - USD</SelectItem>
                    <SelectItem value="GBP">Livre sterling (£) - GBP</SelectItem>
                    <SelectItem value="CHF">Franc suisse (CHF)</SelectItem>
                    <SelectItem value="CAD">Dollar canadien ($) - CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Langue
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="language" className="h-11">
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-6 border-t">
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-semibold"
          onClick={handleSubmit}
          disabled={isLoading || !formData.companyName.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Création en cours...
            </>
          ) : (
            "Créer mon entreprise et continuer"
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Vous pourrez modifier ces informations plus tard dans les paramètres
        </p>
      </CardFooter>
    </Card>
  )
}