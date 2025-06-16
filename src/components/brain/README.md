# 3D Brain Visualization Architecture

This directory contains the React components and hooks responsible for rendering and managing the interactive 3D brain visualization in the application. The architecture is built on `three.js` and `react-three-fiber`, providing a modular and performant system.

## Core Components

### `Brain.tsx`

This is the central component that renders the 3D brain model itself. Its key responsibilities include:

-   **Procedural Geometry:** The brain's shape is generated procedurally using modified spherical coordinates. This creates a unique, organic-looking mesh with distinct anatomical regions.
-   **Vertex Coloring:** During generation, vertices are assigned specific colors based on their location (e.g., frontal lobe, temporal lobe). This color data is crucial for the raycasting system to identify which region a user is interacting with.
-   **Custom Shaders:** A custom GLSL shader is used to give the brain its distinct visual style, including a subtle "breathing" pulse, a fresnel-based edge glow, and an "energy" level that affects its brightness.
-   **Exposed Controls:** It exposes a `brainControls` object through its `userData` prop, allowing parent components to programmatically command the camera and trigger raycasts.

### `BrainDashboard.tsx`

This component acts as the primary user interface and container for the brain visualization. It orchestrates the various UI elements and user interactions.

-   **Scene Setup:** It sets up the main `Canvas` from `react-three-fiber`, including lighting (`BrainLighting.tsx`) and performance settings.
-   **State Management:** It manages the currently selected and hovered brain regions based on user input from the `Brain` component.
-   **UI Overlays:** It renders all 2D UI elements on top of the 3D canvas, such as the instructions panel, the region information display, the color legend, and the `ModuleGrid`.

### `ModuleGrid.tsx`

When a user clicks on a brain region, this component displays a grid of available "modules" (applications or features) associated with that region. It handles the layout of module cards and triggers the `onModuleLaunch` callback when a user selects a module.

## Core Hooks

### `useBrainCamera.tsx`

This hook encapsulates all camera logic, providing a clean, state-based API for controlling camera movements.

-   **State-Based Control:** Defines a set of `CameraState`s (e.g., `overview`, `frontal-zoom`), each with a predefined camera position, target, and FOV.
-   **Smooth Transitions:** Uses `react-spring` to create fluid, interruptible animations when transitioning between camera states.
-   **Auto-Rotation:** Implements a gentle, automatic rotation of the camera when it's in the `overview` state and the user is idle.
-   **Region Focusing:** Provides a `focusOnRegion` function that automatically transitions the camera to the correct state to view a specific region.

### `useBrainRaycasting.tsx`

This hook manages user interaction with the 3D model by translating mouse movements into the 3D scene.

-   **Mouse-to-3D:** It uses a `Raycaster` to determine what part of the 3D scene the user's cursor is pointing at.
-   **Region Identification:** It identifies the brain region by inspecting the vertex color of the mesh at the intersection point. A mapping (`COLOR_TO_REGION`) translates the detected color into a region ID.
-   **Event Handling:** It attaches `click` and `mousemove` event listeners to the canvas to provide hover and click callbacks.

## Data Flow

1.  **User Interaction:** The user moves their mouse over or clicks on the `Canvas` in `BrainDashboard`.
2.  **Raycasting:** `useBrainRaycasting` captures the mouse event, casts a ray into the scene, and finds an intersection with the `Brain` mesh.
3.  **Region ID:** The hook identifies the region's color at the intersection point and returns a `BrainRegionHit` object.
4.  **State Update:** `BrainDashboard` receives the hit data via the `onRegionHover` or `onRegionClick` callbacks and updates its state (e.g., `hoveredRegion`, `selectedRegion`).
5.  **Camera Transition (on click):** `BrainDashboard` calls `brainControls.focusOnRegion()`. This triggers `useBrainCamera` to begin a smooth transition to the appropriate zoomed-in state.
6.  **UI Update:** Based on the updated state, `BrainDashboard` re-renders its UI overlays. If a region is selected, `ModuleGrid` is displayed with the relevant modules.