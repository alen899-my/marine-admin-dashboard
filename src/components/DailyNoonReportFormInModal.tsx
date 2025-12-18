"use client";
import { useModal } from "@/hooks/useModal";
import React from "react";
import Label from "./form/Label";
import Input from "./form/input/InputField";
import TextArea from "./form/input/TextArea"; // or replace with your textarea
import Button from "./ui/button/Button";
import { Modal } from "./ui/modal";

export default function DailyNoonReportFormInModal() {
  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Noon Report");
    closeModal();
  };

  return (
    <div>
      <Button size="sm" onClick={openModal}>
        Open Noon Report Form
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] p-5 lg:p-10"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* HEADING */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Daily Noon Report
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Simple data collection form for daily noon position and
              consumption reports.
            </p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {/* GENERAL INFORMATION */}
            <div className="space-y-5">
              <h3 className="text-base font-medium text-gray-700 border-b pb-1">
                General Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <Label>Vessel Name</Label>
                  <Input type="text" />
                </div>

                <div>
                  <Label>Voyage No / ID</Label>
                  <Input type="text" />
                </div>

                <div>
                  <Label>Report Date & Time </Label>
                  <Input type="datetime-local" />
                </div>

                <div>
                  <Label>Next Port</Label>
                  <Input type="text" />
                </div>
              </div>
            </div>

            {/* POSITION & DISTANCE */}
            <div className="space-y-5">
              <h3 className="text-base font-medium text-gray-700 border-b pb-1">
                Position & Distance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <Label>Latitude</Label>
                  <Input placeholder="24°30.5' N" />
                </div>

                <div>
                  <Label>Longitude</Label>
                  <Input placeholder="054°22.7' E" />
                </div>

                <div>
                  <Label>Distance Travelled (last 24 hrs, NM)</Label>
                  <Input type="number" />
                </div>

                <div>
                  <Label>Distance to Go (NM)</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* FUEL CONSUMPTION */}
            <div className="space-y-5">
              <h3 className="text-base font-medium text-gray-700 border-b pb-1">
                Fuel Consumption
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <Label>Fuel Consumed - VLSFO (MT)</Label>
                  <Input type="number" />
                </div>

                <div>
                  <Label>Fuel Consumed - LSMGO (MT)</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* WEATHER */}
            <div className="space-y-5">
              <h3 className="text-base font-medium text-gray-700 border-b pb-1">
                Weather
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <Label>Wind / Beaufort Scale</Label>
                  <Input placeholder="NW 15 kn / BF 4" />
                </div>

                <div>
                  <Label>Sea State / Swell</Label>
                  <Input />
                </div>
              </div>

              <div>
                <Label>Weather Remarks</Label>
                <TextArea placeholder="Any additional details about weather, visibility, current, etc." />
              </div>
            </div>

            {/* GENERAL REMARKS */}
            <div className="space-y-5">
              <h3 className="text-base font-medium text-gray-700 border-b pb-1">
                General Remarks
              </h3>

              <TextArea placeholder="Any operational notes, incidents, speed changes, etc." />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm">Submit</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
