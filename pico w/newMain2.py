from mfrc522 import MFRC522
import time
import socket
import ssl
import json
from machine import Pin
import network
import gc

# SSID = "Mega_2.4G_6EC7"
# PASSWORD = "ccf7E7x4"

SSID = "ARRIS-7FD4"
PASSWORD = "2WC456400237"

# SSID = "ARRIS-7FD4"
# PASSWORD = "2WC456400237"
# (local)

# SSID = "Kame House"
# PASSWORD = "kamehouse123"

# SSID = "INFINITUME1D8"
# PASSWORD = "LQDe2w4dg3"

# SSID = "AMZU CNC"
# PASSWORD = "Amzu12345678"

# Host Railway (sin https://)
HOST = "pokimonultimix-production.up.railway.app"
PATH_SCAN   = "/scan-pokemon"
PATH_TURN   = "/next-turn"
PATH_BATTLE = "/scan-battle-pokemon"

# Número de jugador asignado a este botón: "player1", "player2", "player3", "player4" o "master"
PLAYER_BUTTON = "player1"

# Tiempo para detectar pulsación larga (ms)
LONG_PRESS_TIME = 1000  # 1 segundo

# Cache UID
last_uid = None
last_scan_time = 0
SCAN_COOLDOWN = 2000  # 2 segundos

# =========================
# HARDWARE
# =========================

lector = MFRC522(spi_id=0, sck=2, miso=4, mosi=3, cs=1, rst=0)
button_pin = Pin(10, Pin.IN, Pin.PULL_UP)
scan_pin = Pin(11, Pin.IN, Pin.PULL_UP)

print("Lector activo...\n")

# =========================
# WIFI
# =========================

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(SSID, PASSWORD)

while not wlan.isconnected():
    print('Waiting for connection...')
    time.sleep(1)

print("Conectado a la red WiFi")
print("Dirección IP:", wlan.ifconfig())

# =========================
# FUNCIONES AUXILIARES
# =========================

def can_scan(uid):
    global last_uid, last_scan_time

    current_time = time.ticks_ms()

    if last_uid == uid:
        if time.ticks_diff(current_time, last_scan_time) < SCAN_COOLDOWN:
            print("UID repetido - ignorado")
            return False

    last_uid = uid
    last_scan_time = current_time
    return True

# =========================
# HTTPS POST (sin urequests)
# =========================

def https_post(path, payload):
    body = json.dumps(payload)

    ai = socket.getaddrinfo(HOST, 443, 0, socket.SOCK_STREAM)[0]
    s = socket.socket()
    s.connect(ai[-1])

    try:
        s = ssl.wrap_socket(s, server_hostname=HOST)
    except TypeError:
        s = ssl.wrap_socket(s)

    request = (
        "POST {} HTTP/1.0\r\n"
        "Host: {}\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: {}\r\n"
        "Connection: close\r\n"
        "\r\n"
        "{}"
    ).format(path, HOST, len(body), body)

    s.write(request.encode())

    # Leer solo la línea de estado
    line = b""
    while True:
        c = s.read(1)
        if not c or c == b'\n':
            break
        line += c

    s.close()
    gc.collect()

    try:
        return int(line.decode().strip().split()[1])
    except Exception:
        return 0

# =========================
# FUNCIONES HTTP
# =========================

def next_turn():
    try:
        status = https_post(PATH_TURN, {"playerButton": PLAYER_BUTTON})
        if status == 200:
            print("Función 'next-turn' activada correctamente.")
        else:
            print(f"Error: {status}")
    except Exception as e:
        print("Error en next-turn:", e)

def scan_pokemon(pokemonUID):
    try:
        print("SCAN:", pokemonUID)
        status = https_post(PATH_SCAN, {"pokemonUID": pokemonUID, "playerButton": PLAYER_BUTTON})
        if status == 200:
            print("Pokémon escaneado correctamente.")
        else:
            print(f"Error: {status}")
    except Exception as e:
        print("Error en scan:", e)
    finally:
        gc.collect()

def battle_pokemon(pokemonUID):
    try:
        print("BATTLE:", pokemonUID)
        status = https_post(PATH_BATTLE, {"pokemonUID": pokemonUID, "playerButton": PLAYER_BUTTON})
        if status == 200:
            print("Batalla enviada correctamente.")
        else:
            print(f"Error: {status}")
    except Exception as e:
        print("Error en battle:", e)
    finally:
        gc.collect()

# =========================
# MAIN LOOP
# =========================

def main():
    while True:
        lector.init()

        # BOTÓN NEXT TURN
        if button_pin.value() == 0 and scan_pin.value() == 1:
            print("NEXT TURN")
            next_turn()
            time.sleep(0.4)

        # BOTÓN SCAN
        elif scan_pin.value() == 0 and button_pin.value() == 1:
            print("SCAN_PIN PRESIONADO")

            start_time = time.ticks_ms()

            while scan_pin.value() == 0:
                time.sleep(0.01)

            press_duration = time.ticks_diff(time.ticks_ms(), start_time)
            print("Duración:", press_duration)

            (stat, tag_type) = lector.request(lector.REQIDL)
            print("Request stat:", stat)

            if stat == lector.OK:
                (stat, uid) = lector.SelectTagSN()
                print("SelectTagSN stat:", stat, "uid:", uid)
            else:
                uid = None

            if uid:
                identificador = int.from_bytes(bytes(uid), "little", False)
            else:
                identificador = 0

            print("Identificador:", identificador)

            if identificador != 0 and can_scan(identificador):
                print("UID:", identificador)

                if press_duration >= LONG_PRESS_TIME:
                    print("LONG PRESS → scan_pokemon")
                    scan_pokemon(identificador)
                else:
                    print("SHORT PRESS → battle_pokemon")
                    battle_pokemon(identificador)

            identificador = None
            time.sleep(0.4)

        time.sleep(0.05)

# Ejecutar
if __name__ == "__main__":
    main()
