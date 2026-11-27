import psycopg

def check():
    url = "postgresql://mokarrar_user:9jGLZa6EtkIRTbafQm8Xxd52QA5OgKR6@dpg-dc0u7lk9v7es739v1i10-a/mokarrar"
    try:
        conn = psycopg.connect(url)
        with conn.cursor() as cur:
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user';")
            cols = cur.fetchall()
            print("Columns in user table:")
            for c in cols:
                print(c)
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check()
