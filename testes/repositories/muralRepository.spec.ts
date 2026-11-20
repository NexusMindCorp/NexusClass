import { expect, it, vi } from "vitest";
import { MuralRepository } from "@/repositories/MuralRepository";
import type { ClienteSupabaseTipado } from "@/repositories/base";

it("solicita os posts da turma do mais recente ao mais antigo com desempate por ID", async () => {
  const order = vi.fn().mockReturnValueOnce({
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  const eq = vi.fn().mockReturnValue({ order });
  const client = {
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }),
  } as unknown as ClienteSupabaseTipado;

  await new MuralRepository(client).listarPosts("1");

  expect(eq).toHaveBeenCalledWith("id_turma", 1);
  expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  expect(order.mock.results[0].value.order).toHaveBeenCalledWith("id_post", { ascending: false });
});
