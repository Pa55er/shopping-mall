import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./store/index.js";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <Provider store={store}>
                {/* Redux 스토어에서 지속 데이터를 사용할 수 있을 때까지 앱의 UI
                렌더링을 지연할 수 있습니다. 이를 위해서 Redux Persist에는 PersistGate
                구성 요소가 포함되어 있습니다. */}
                <PersistGate loading={null} persistor={persistor}>
                    <App />
                </PersistGate>
            </Provider>
        </BrowserRouter>
    </StrictMode>
);
