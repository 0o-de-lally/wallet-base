import React from "react";
import { Stack } from "expo-router";
import { Menu } from "../components/menu/Menu";

export default function MenuScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Menu", headerBackTitle: "Back" }} />
      <Menu />
    </>
  );
}
