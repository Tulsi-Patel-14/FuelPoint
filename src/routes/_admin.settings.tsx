import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminService, type StationSettings } from "@/services/adminService";

export const Route = createFileRoute("/_admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FuelPoint Admin" },
      {
        name: "description",
        content: "Manage your station and geofence configuration.",
      },
      { property: "og:title", content: "Settings — FuelPoint Admin" },
      {
        property: "og:description",
        content: "Manage your station and geofence configuration.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<StationSettings>({
    stationName: "",
    latitude: 0,
    longitude: 0,
    radiusMeters: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const data = await adminService.getStationSettings();
        if (mounted && data) {
          setSettings(data);
        }
      } catch (err: any) {
        if (mounted) toast.error("Failed to load settings", { description: err.message });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.stationName.trim()) {
      newErrors.stationName = "Station Name cannot be empty.";
    }

    const lat = Number(settings.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = "Must be a valid number between -90 and 90.";
    }

    const lng = Number(settings.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = "Must be a valid number between -180 and 180.";
    }

    const radius = Number(settings.radiusMeters);
    if (isNaN(radius) || radius <= 0) {
      newErrors.radiusMeters = "Geofence radius must be a positive number in meters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await adminService.updateStationSettings({
        stationName: settings.stationName.trim(),
        latitude: Number(settings.latitude),
        longitude: Number(settings.longitude),
        radiusMeters: Number(settings.radiusMeters),
      });
      setSettings(updated);
      setErrors({});
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="Settings" 
        subtitle="Manage your station and geofence configuration." 
      />

      <Panel title="Station & Geofence Settings">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="stationName">
                Station Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stationName"
                value={settings.stationName}
                onChange={(e) => {
                  setSettings({ ...settings, stationName: e.target.value });
                  if (errors.stationName) setErrors((prev) => ({ ...prev, stationName: "" }));
                }}
                placeholder="e.g. Nayara Energy - Ahmedabad"
                className={errors.stationName ? "border-destructive" : ""}
              />
              {errors.stationName && (
                <p className="mt-1 text-xs text-destructive">{errors.stationName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">
                Latitude <span className="text-destructive">*</span>
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={settings.latitude === 0 ? "" : settings.latitude}
                onChange={(e) => {
                  setSettings({ ...settings, latitude: e.target.value as unknown as number });
                  if (errors.latitude) setErrors((prev) => ({ ...prev, latitude: "" }));
                }}
                placeholder="e.g. 23.0225"
                className={errors.latitude ? "border-destructive" : ""}
              />
              {errors.latitude && (
                <p className="mt-1 text-xs text-destructive">{errors.latitude}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">
                Longitude <span className="text-destructive">*</span>
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={settings.longitude === 0 ? "" : settings.longitude}
                onChange={(e) => {
                  setSettings({ ...settings, longitude: e.target.value as unknown as number });
                  if (errors.longitude) setErrors((prev) => ({ ...prev, longitude: "" }));
                }}
                placeholder="e.g. 72.5714"
                className={errors.longitude ? "border-destructive" : ""}
              />
              {errors.longitude && (
                <p className="mt-1 text-xs text-destructive">{errors.longitude}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiusMeters">
                Geofence Radius (meters) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="radiusMeters"
                type="number"
                step="any"
                min="1"
                value={settings.radiusMeters === 0 ? "" : settings.radiusMeters}
                onChange={(e) => {
                  setSettings({ ...settings, radiusMeters: e.target.value as unknown as number });
                  if (errors.radiusMeters) setErrors((prev) => ({ ...prev, radiusMeters: "" }));
                }}
                placeholder="e.g. 150"
                className={errors.radiusMeters ? "border-destructive" : ""}
              />
              {errors.radiusMeters && (
                <p className="mt-1 text-xs text-destructive">{errors.radiusMeters}</p>
              )}
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
