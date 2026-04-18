#!/usr/bin/env python3
import asyncio
from app.database import db as database

async def test():
    await database.connect()
    users = await database.user.find_many()
    print(f'Total users: {len(users)}')
    for u in users:
        print(f'  - {u.email} ({u.role}) - Last login: {u.last_login or "Never"}')
    await database.disconnect()

asyncio.run(test())
